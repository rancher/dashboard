import merge from 'lodash/merge';

import { SCHEMA } from '@shell/config/types';
import { SPOOFED_API_PREFIX, SPOOFED_PREFIX } from '@shell/store/type-map';
import { createYaml } from '@shell/utils/create-yaml';
import { classify } from '@shell/plugins/dashboard-store/classify';
import { normalizeType } from './normalize';
import garbageCollect from '@shell/utils/gc/gc';
import { addSchemaIndexFields } from '@shell/plugins/steve/schema.utils';
import { addParam, parse } from '@shell/utils/url';
import { conditionalDepaginate } from '@shell/store/type-map.utils';
import { STEVE_WATCH_MODE } from '@shell/types/store/subscribe.types';
import { FilterArgs } from '@shell/types/store/pagination.types';
import { isLabelSelectorEmpty, labelSelectorToSelector } from '@shell/utils/selector-typed';

export const _ALL = 'all';
export const _MERGE = 'merge';
export const _MULTI = 'multi';
export const _NONE = 'none';

const SCHEMA_CHECK_RETRIES = 15;
const HAVE_ALL_CHECK_RETRIES = 15;
const RETRY_LOG = 10;

export async function handleSpoofedRequest(rootGetters, schemaStore, opt, product) {
  // Handle spoofed types instead of making an actual request
  // Spoofing is handled here to ensure it's done for both yaml and form editing.
  // It became apparent that this was the only place that both intersected
  if (opt.url.includes(SPOOFED_PREFIX) || opt.url.includes(SPOOFED_API_PREFIX)) {
    const [empty, scheme, type, ...rest] = opt.url.split('/'); // eslint-disable-line no-unused-vars
    const id = rest.join('/'); // Cover case where id contains '/'
    const isApi = scheme === SPOOFED_API_PREFIX;
    const typemapGetter = id ? 'getSpoofedInstance' : 'getSpoofedInstances';

    const schemas = rootGetters[`${ schemaStore }/all`](SCHEMA);
    // getters return async getSpoofedInstance/getSpoofedInstances fn
    const instance = await rootGetters[`type-map/${ typemapGetter }`](type, product, id);
    const data = isApi ? createYaml(schemas, type, instance) : instance;

    return id && !isApi ? data : { data };
  }
}

export async function loadSchemas(ctx, watch = true) {
  const {
    getters, dispatch, commit, rootGetters
  } = ctx;
  const res = await dispatch('findAll', { type: SCHEMA, opt: { url: 'schemas', load: false } });
  const spoofedTypes = rootGetters['type-map/allSpoofedSchemas'] ;

  if (Array.isArray(res.data)) {
    res.data = res.data.concat(spoofedTypes);
  } else if (Array.isArray(res)) {
    res.data = res.concat(spoofedTypes);
  }

  res.data.forEach(addSchemaIndexFields);

  commit('loadAll', {
    ctx,
    type:     SCHEMA,
    data:     res.data,
    revision: res.revision
  });

  if ( watch !== false ) {
    dispatch('watch', {
      type:     SCHEMA,
      revision: res.revision
    });
  }

  const all = getters.all(SCHEMA);

  return all;
}

const findAllGetter = (getters, type, opt) => {
  return opt.namespaced ? getters.matching(type, null, opt.namespaced, { skipSelector: true }) : getters.all(type);
};

const createFindWatchArg = ({
  type, id, opt, res
}) => {
  const revision = typeof opt.revision !== 'undefined' ? opt.revision : res?.metadata?.resourceVersion;
  const watchMsg = {
    type,
    id,
    // Although not used by sockets, we need this for when resyncWatch calls find... which needs namespace to construct the url
    namespace: opt.namespaced,
    revision:  revision || '',
    force:     opt.forceWatch === true,
  };

  const idx = id.indexOf('/');

  if ( idx > 0 ) {
    watchMsg.namespace = id.substr(0, idx);
    watchMsg.id = id.substr(idx + 1);
  }

  return watchMsg;
};

export default {
  request() {
    throw new Error('Not Implemented');
  },

  loadSchemas,

  /**
   * Load a page of data for a given type. Given the response will continue until there are no pages left to fetch
   *
   * Used for incremental loading when enabled
   *
   * If we're in the non-vai world paginate via native limit/next (pageByLimit)
   * If we're in the vai world paginate via page number (pageByNumber)
   */
  async loadDataPage(ctx, {
    type, opt, pageByLimit, pageByNumber
  }) {
    const { getters, commit, dispatch } = ctx;

    type = getters.normalizeType(type);

    // if there's no registered type, then register it so
    // that we don't have issues on 'loadAdd' mutation
    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    const loadCount = getters['loadCounter'](type);

    try {
      if (pageByLimit) {
        opt.url = pageByLimit.next;
      } else if (pageByNumber) {
        const { url, page, pageSize } = pageByNumber;

        opt.url = addParam(url, 'page', `${ page }`);
        opt.url = addParam(opt.url, 'pagesize', `${ pageSize }`);
      } else {
        throw Error('loadDataPage requires either pageByLimit or pageByNumber');
      }

      const res = await dispatch('request', { opt, type });

      const newLoadCount = getters['loadCounter'](type);

      // Load count changed, so we changed page or started a new load
      // after this page load was started, so don't continue with incremental load
      if (loadCount !== newLoadCount) {
        return;
      }

      commit('loadAdd', {
        ctx,
        type,
        data: res.data,
      });

      if (pageByLimit && res.pagination?.next) {
        dispatch('loadDataPage', {
          type,
          opt,
          pageByLimit: { next: res.pagination.next },
        });
      } else if (pageByNumber && pageByNumber.page !== pageByNumber.pages) {
        dispatch('loadDataPage', {
          type,
          opt,
          pageByNumber: {
            ...pageByNumber,
            page: pageByNumber.page + 1,
          }
        });
      } else {
        // We have everything!
        if (opt.hasManualRefresh) {
          dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
        }
        if (opt.namespaced) {
          commit('setHaveNamespace', { type, namespace: opt.namespaced });
        } else {
          commit('setHaveAll', { type });
        }
      }
    } catch (e) {
      if (opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
      }

      return Promise.reject(e);
    }
  },

  /**
   *
   * @param {*} ctx
   * @param { {type: string, opt: ActionFindAllArgs} } opt
   */
  async findAll(ctx, { type, opt }) {
    const {
      getters, commit, dispatch, rootGetters
    } = ctx;

    opt = opt || {};
    type = getters.normalizeType(type);
    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    // No need to request the resources if we have them already
    if (
      !opt.force &&
      (
        getters['haveAll'](type) ||
        getters['haveAllNamespace'](type, opt.namespaced)
      )
    ) {
      if (opt.watch !== false ) {
        // Note - Empty revision here seems broken
        // - list page (watch all) --> detail page (stop watch all, watch one) --> list page (watch all - no revision)
        // - the missing revision means watch start from now... instead of the point the clusters were last monitored (cache contains stale data)
        const args = {
          type,
          revision:  '',
          // watchNamespace - used sometimes when we haven't fetched the results of a single namespace
          // namespaced - used when we have fetched the result of a single namespace (see https://github.com/rancher/dashboard/pull/7329/files)
          namespace: opt.watchNamespace || opt.namespaced
        };

        dispatch('watch', args);
      }

      return findAllGetter(getters, type, opt);
    }

    let load = (opt.load === undefined ? _ALL : opt.load);

    if ( opt.load === false || opt.load === _NONE ) {
      load = _NONE;
    }

    const typeOptions = rootGetters['type-map/optionsFor'](type);

    console.log(`Find All: [${ ctx.state.config.namespace }] ${ type }`); // eslint-disable-line no-console
    opt = opt || {};
    opt.isCollection = true;
    opt.url = getters.urlFor(type, null, opt);
    opt.stream = opt.stream !== false && load !== _NONE;
    opt.depaginate = conditionalDepaginate(typeOptions?.depaginate, { ctx, args: { type, opt } });

    let skipHaveAll = false;

    // if it's incremental loading, we do two parallel requests
    // one for a limit of 100, to quickly show data
    // another one with 1st page of the subset of the resource we are fetching
    // the default is 4 pages, but it can be changed on mixin/resource-fetch.js
    let pageByLimit, pageByNumber;

    if (opt.incremental) {
      commit('incrementLoadCounter', type);

      if (opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', true, { root: true });
      }

      if (opt.incremental.pageByNumber && getters.isSteveCacheUrl(parse(opt.url).path)) {
        // Set the configuration for the rest of the incremental requests
        pageByNumber = {
          url:      opt.url,
          page:     1,
          pages:    opt.incremental.increments,
          pageSize: opt.incremental.resourcesPerIncrement,
        };
        // this is where we "hijack" the limit for the dispatch('request') some lines below and therefore have 2 initial requests in parallel
        opt.url = addParam(opt.url, 'pagesize', `${ opt.incremental.quickLoadCount }`);
      } else {
        // Set the configuration for the rest of the incremental requests
        pageByLimit = { next: addParam(opt.url, 'limit', `${ opt.incremental.resourcesPerIncrement }`) };
        // this is where we "hijack" the limit for the dispatch('request') some lines below and therefore have 2 initial requests in parallel
        opt.url = addParam(opt.url, 'limit', `${ opt.incremental.quickLoadCount }`);
      }

      skipHaveAll = true;

      // since we are forcing a request, clear the haveAll
      // needed for the resource-fetch mixin, otherwise the incremental indicator
      // won't pop-up again when manual refreshing
      if (opt.force) {
        commit('forgetType', type);
      }
    }

    let streamStarted = false;
    let out;

    let queue = [];
    let streamCollection;

    opt.onData = function(data) {
      if ( streamStarted ) {
        // Batch loads into groups of 10 to reduce vuex overhead
        queue.push(data);

        if ( queue.length > 10 ) {
          const tmp = queue;

          queue = [];
          commit('loadMulti', { ctx, data: tmp });
        }
      } else {
        // The first line is the collection object (sans `data`)
        commit('forgetAll', { type });
        streamStarted = true;
        streamCollection = data;
      }
    };

    try {
      if (!opt.incremental && opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', true, { root: true });
      }

      const res = await dispatch('request', { opt, type });

      if ( streamStarted ) {
        // Flush any remaining entries left over that didn't get loaded by onData
        if ( queue.length ) {
          commit('loadMulti', { ctx, data: queue });
          queue = [];
        }
        commit('loadedAll', { type });
        const all = getters.all(type);

        res.finishDeferred(all);
        out = streamCollection;
      } else {
        out = res;
      }
    } catch (e) {
      if (!opt.incremental && opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
      }

      return Promise.reject(e);
    }

    if ( load === _NONE ) {
      if (!opt.incremental && opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
      }

      return out;
    } else if ( out.data ) {
      if ( load === _MULTI ) {
        // This has the effect of adding the response to the store,
        // without replacing all the existing content for that type,
        // and without marking that type as having 'all 'loaded.
        //
        // This is used e.g. to load a partial list of settings before login
        // while still knowing we need to load the full list later.
        commit('loadMulti', {
          ctx,
          data: out.data
        });
      } else if (load === _MERGE) {
        // This is like loadMulti (updates existing entries) but also removes entries that no longer exist
        // This allows changes to existing resources to be reflected in place in the UI
        // (normally not needed as Rancher updates come over socket and are handled individually)
        commit('loadMerge', {
          ctx,
          type,
          data:     out.data,
          existing: true
        });
      } else {
        commit('loadAll', {
          ctx,
          type,
          data:       out.data,
          revision:   out.revision,
          skipHaveAll,
          namespace:  opt.namespaced,
          pagination: opt.pagination ? {
            request: opt.pagination,
            result:  {
              count:     out.count,
              pages:     out.pages,
              timestamp: new Date().getTime()
            }
          } : undefined,
        });
      }

      if (opt.incremental) {
        // This needs to come after the loadAll (which resets state) so supplements via loadDataPage aren't lost
        dispatch('loadDataPage', {
          type, opt, pageByLimit, pageByNumber
        });
      }
    }

    // ToDo: SM if we start a "bigger" watch (such as watch without a namespace vs a watch with a namespace), we should stop the stop the "smaller" watch so we don't have duplicate events coming back
    if ( opt.watch !== false ) {
      const args = {
        type,
        revision:  out.revision,
        namespace: opt.watchNamespace || opt.namespaced, // it could be either apparently
        // ToDo: SM namespaced is sometimes a boolean and sometimes a string, I don't see it as especially broken but we should refactor that in the future
        force:     opt.forceWatch === true,
      };

      dispatch('watch', args);
    }

    const all = findAllGetter(getters, type, opt);

    if (!opt.incremental && opt.hasManualRefresh) {
      dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
    }

    garbageCollect.gcUpdateLastAccessed(ctx, type);

    return all;
  },

  /**
   * If result not already cached, make a http request to fetch a specific set of resources
   *
   * This accepts all the new sql-cache backed api features (sort, filter, etc)
   *
   * @param {*} ctx
   * @param { {type: string, opt: ActionFindPageArgs} } opt
   * @returns @ActionFindPageResponse
   */
  async findPage(ctx, { type, opt }) {
    const { getters, commit, dispatch } = ctx;

    // of type @ActionFindPageArgs
    opt = opt || {};

    if (!opt.pagination) {
      console.error('Attempting to find a page for a resource but no pagination settings supplied', type); // eslint-disable-line no-console

      return;
    }

    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    // of type @STEVE_WATCH_PARAMS
    const watchArgs = {
      type,
      namespace: opt.watchNamespace || opt.namespaced, // it could be either apparently
      force:     opt.forceWatch === true,
      mode:      STEVE_WATCH_MODE.RESOURCE_CHANGES,
    };

    // No need to request the resources if we have them already
    if (!opt.transient && !opt.force && getters['havePaginatedPage'](type, opt)) {
      if (opt.watch !== false ) {
        dispatch('watch', watchArgs);
      }

      return findAllGetter(getters, type, opt);
    }

    console.log(`Find Page: [${ ctx.state.config.namespace }] ${ type }. Page: ${ opt.pagination.page }. Size: ${ opt.pagination.pageSize }. Sort: ${ opt.pagination.sort.map((s) => s.field).join(', ') }`); // eslint-disable-line no-console
    opt = opt || {};
    opt.url = getters.urlFor(type, null, opt);

    let out;

    try {
      if (opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', true, { root: true });
      }

      out = await dispatch('request', { opt, type });
    } catch (e) {
      if (opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
      }

      return Promise.reject(e);
    }

    // Of type @StorePagination
    const pagination = opt.pagination ? {
      request: {
        namespace:  opt.namespaced,
        pagination: opt.pagination
      },
      result: {
        count:     out.count,
        pages:     out.pages || Math.ceil(out.count / (opt.pagination.pageSize || Number.MAX_SAFE_INTEGER)),
        timestamp: new Date().getTime()
      }
    } : undefined;

    if (!opt.transient) {
      commit('loadPage', {
        ctx,
        type,
        data:     out.data,
        pagination,
        revision: out.revision,
      });
    }

    if ( !opt.transient && opt.watch !== false ) {
      dispatch('watch', watchArgs);
    }

    if (opt.hasManualRefresh) {
      dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
    }

    garbageCollect.gcUpdateLastAccessed(ctx, type);

    return opt.transient ? {
      data: await dispatch('createMany', out.data), // Return classified objects
      pagination
    } : findAllGetter(getters, type, opt);
  },

  /**
   * Find results matching a kube `labelSelector` object
   *
   * If result not already cached, make a http request to fetch resources matching the selector/s
   *
   * This is different if vai based pagination is on
   * a) Pagination Enabled - use the new sql-cache backed api - findPage
   * b) Pagination Disabled - use the old 'native kube api' - findMatching
   *
   * Filter is defined via the kube labelSelector object (see KubeLabelSelector)
   *
   * opt: @ActionFindLabelSelectorArgs
   * @returns @ActionFindMatchingResponse (resources[], or if transient { data: resources[], pagination: StorePagination })
   */
  async findLabelSelector(ctx, {
    type,
    context,
    matching: {
      namespace,
      labelSelector
    },
    opt
  }) {
    const { getters, dispatch } = ctx;
    const args = {
      id: type,
      context,
    };

    opt = opt || {};

    if (getters[`paginationEnabled`]?.(args)) {
      if (isLabelSelectorEmpty(labelSelector)) {
        throw new Error(`labelSelector must not be empty when using findLabelSelector (avoid fetching all resources)`);
      }

      // opt of type ActionFindPageArgs
      return dispatch('findPage', {
        type,
        opt: {
          ...opt,
          namespaced: namespace,
          pagination: new FilterArgs({ labelSelector }),
          transient:  opt?.transient !== undefined ? opt.transient : false // Call this out explicitly here, as by default findX methods ar eusually be cached AND watched
        }
      });
    }

    // opt of type ActionFindPageArgs
    const findMatching = await dispatch('findMatching', {
      type,
      selector: labelSelectorToSelector(labelSelector),
      opt,
      namespace,
    });

    return opt.transient ? { data: findMatching } : findMatching;
  },

  /**
   * opt: @ActionFindMatchingArgs
   */
  async findMatching(ctx, {
    type,
    selector,
    opt,
    namespace
  }) {
    const {
      getters, commit, dispatch, rootGetters
    } = ctx;

    opt = opt || {};
    console.log(`Find Matching: [${ ctx.state.config.namespace }] ${ type }`, selector); // eslint-disable-line no-console
    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    if ( opt.force !== true && getters['haveSelector'](type, selector)) {
      return getters.all(type);
    }

    // Optimisation - We can pretend like we've fetched a specific selectors worth instead of replacing ALL pods with only SOME
    if ( opt.force !== true && getters['haveAll'](type)) {
      return getters.matching( type, selector, namespace );
    }

    const typeOptions = rootGetters['type-map/optionsFor'](type);

    opt = opt || {};
    opt.labelSelector = selector;
    opt.isCollection = true;
    opt.namespaced = namespace;
    opt.url = getters.urlFor(type, null, opt);
    opt.depaginate = conditionalDepaginate(typeOptions?.depaginate, { ctx, args: { type, opt } });

    const res = await dispatch('request', { opt, type });

    if ( opt.load === false ) {
      return res.data;
    }

    commit('loadSelector', {
      ctx,
      type,
      entries:  res.data,
      selector,
      revision: res.revision,
    });

    if ( opt.watch !== false ) {
      dispatch('watch', {
        type,
        selector,
        revision: res.revision,
        force:    opt.forceWatch === true,
      });
    }

    garbageCollect.gcUpdateLastAccessed(ctx, type);

    return getters.all(type);
  },

  // opt:
  //  filter: Filter by fields, e.g. {field: value, anotherField: anotherValue} (default: none)
  //  limit: Number of records to return per page (default: 1000)
  //  sortBy: Sort by field
  //  sortOrder: asc or desc
  //  url: Use this specific URL instead of looking up the URL for the type/id.  This should only be used for bootstrapping schemas on startup.
  //  @TODO depaginate: If the response is paginated, retrieve all the pages. (default: true)
  async find(ctx, { type, id, opt }) {
    if (!id) {
      console.error('Attempting to find a resource with no id', type, id); // eslint-disable-line no-console

      return;
    }

    const { getters, dispatch } = ctx;

    opt = opt || {};

    type = normalizeType(type);

    console.log(`Find: [${ ctx.state.config.namespace }] ${ type } ${ id }`); // eslint-disable-line no-console
    let out;

    if ( opt.force !== true ) {
      out = getters.byId(type, id);

      if ( out ) {
        if ( opt.watch !== false ) {
          dispatch('watch', createFindWatchArg({
            type, id, opt, res: undefined
          }));
        }

        return out;
      }
    }

    opt = opt || {};
    opt.url = getters.urlFor(type, id, opt);

    const res = await dispatch('request', { opt, type });

    await dispatch('load', { data: res, invalidatePageCache: opt.invalidatePageCache });

    if ( opt.watch !== false ) {
      dispatch('watch', createFindWatchArg({
        type, id, opt, res
      }));
    }

    out = getters.byId(type, id);

    garbageCollect.gcUpdateLastAccessed(ctx, type);

    return out;
  },

  /**
   * Add or update the given resource in the store
   *
   * invalidatePageCache
   * - if something calls `load` then the cache no longer has a page so we invalidate it
   * - however on resource create or remove this can lead to lists showing nothing... before the new page is fetched
   * - for those cases avoid invaliding the page cache
   */
  load(ctx, { data, existing, invalidatePageCache }) {
    const { getters, commit } = ctx;

    let type = normalizeType(data.type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    if ( data.baseType && data.baseType !== data.type ) {
      type = normalizeType(data.baseType);

      if ( !getters.typeRegistered(type) ) {
        commit('registerType', type);
      }
    }
    // Inject special fields for indexing schemas
    if ( type === SCHEMA ) {
      addSchemaIndexFields(data);
    }

    const keyField = getters.keyFieldForType(type);
    const id = data?.[keyField] || existing?.[keyField];

    if ( !id ) {
      console.warn('Attempting to load a resource with no id', data, existing); // eslint-disable-line no-console

      return;
    }

    commit('load', {
      ctx,
      data,
      existing,
      invalidatePageCache // Avoid havePage invalidation
    });

    if ( type === SCHEMA ) {
      commit('type-map/schemaChanged', null, { root: true });
    }

    return getters['byId'](type, id);
  },

  loadMulti(ctx, data) {
    const { commit } = ctx;

    commit('loadMulti', {
      data,
      ctx,
    });
  },

  batchChanges(ctx, batch) {
    const { commit } = ctx;

    commit('batchChanges', {
      ctx,
      batch
    });
  },

  loadAll(ctx, { type, data }) {
    const { commit } = ctx;

    commit('loadAll', {
      ctx,
      type,
      data
    });
  },

  create(ctx, data) {
    return classify(ctx, data);
  },

  createMany(ctx, data) {
    return data.map((d) => classify(ctx, d));
  },

  async createPopulated(ctx, userData) {
    let data = null;

    const schema = ctx.getters['schemaFor'](userData.type);

    if (schema) {
      if (schema.fetchResourceFields) {
        // fetch resourceFields for createYaml
        await schema.fetchResourceFields();
      }
      data = ctx.getters['defaultFor'](userData.type, schema);
    }

    merge(data, userData);

    return classify(ctx, data);
  },

  clone(ctx, { resource } = {}) {
    return classify(ctx, resource.toJSON(), true);
  },

  /**
   * Remove all cached entries for a resource and stop watches
   */
  forgetType({ commit, dispatch, state }, type, compareWatches) {
    // Stop all known watches
    state.started
      .filter((entry) => compareWatches ? compareWatches(entry) : entry.type === type)
      .forEach((entry) => dispatch('unwatch', entry));

    // Stop all known back-off watch processes for this type
    dispatch('resetWatchBackOff', {
      type, compareWatches, resetStarted: false
    });

    // Remove entries from store
    commit('forgetType', type);
  },

  promptRemove({ commit, state }, resources ) {
    commit('action-menu/togglePromptRemove', resources, { root: true });
  },

  promptModal({ commit, state }, data ) {
    commit('action-menu/togglePromptModal', data, { root: true });
  },

  resourceAction({ getters, dispatch }, {
    resource, actionName, body, opt,
  }) {
    throw new Error('Not Implemented');
  },

  collectionAction({ getters, dispatch }, {
    type, actionName, body, opt
  }) {
    throw new Error('Not Implemented');
  },

  cleanForNew(ctx, resource) {
    throw new Error('Not Implemented');
  },

  createNamespace(ctx, resource) {
    throw new Error('Not Implemented');
  },

  cleanForDiff(ctx, resource) {
    throw new Error('Not Implemented');
  },

  // Clean a resource for the ResourceDetail page
  // This can ensure common, required properties exists that might have been removed
  cleanForDetail(ctx, resource) {
    return resource;
  },

  cleanForDownload(ctx, resource) {
    return resource;
  },

  // Wait for a schema that is expected to exist that may not have been loaded yet (for instance when loadCluster is still running).
  async waitForSchema({ getters, dispatch }, { type }) {
    let tries = SCHEMA_CHECK_RETRIES;
    let schema = null;

    while (!schema && tries > 0) {
      // Schemas may not have been loaded, so don't error out if they are not loaded yet
      // the wait here will wait for schemas to load and then for the desired schema to be available
      schema = getters['schemaFor'](type, false, false);

      if (!schema) {
        if (tries === RETRY_LOG) {
          console.warn(`Schema for ${ type } not available... retrying...`); // eslint-disable-line no-console
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        tries--;
      }
    }

    if (tries === 0) {
      // Ran out of tries - fetch the schemas again
      console.warn(`Schema for ${ type } still unavailable... loading schemas again...`); // eslint-disable-line no-console
      await dispatch('loadSchemas', true);
    }
  },

  async waitForHaveAll({ getters }, { type, throwError = false, attempts = HAVE_ALL_CHECK_RETRIES }) {
    let tries = attempts;
    let haveAll = null;

    while (!haveAll && tries > 0) {
      haveAll = getters['haveAll'](type);

      if (!haveAll) {
        if (tries === RETRY_LOG) {
          console.warn(`wait for all of ${ type } continuing...`); // eslint-disable-line no-console
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        tries--;
      }
    }

    if (tries === 0 && throwError) {
      throw new Error(`Failed to wait for all of ${ type }`);
    }
  },

  incrementLoadCounter({ commit }, resource) {
    commit('incrementLoadCounter', resource);
  },

  garbageCollect(ctx, ignoreTypes) {
    return garbageCollect.garbageCollect(ctx, ignoreTypes);
  },

  gcResetStore({ state }) {
    garbageCollect.gcResetStore(state);
  }
};
