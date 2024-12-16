import merge from 'lodash/merge';

import { SCHEMA } from '@shell/config/types';
import { SPOOFED_API_PREFIX, SPOOFED_PREFIX } from '@shell/store/type-map';
import { createYaml } from '@shell/utils/create-yaml';
import { classify } from '@shell/plugins/dashboard-store/classify';
import { normalizeType } from './normalize';
import garbageCollect from '@shell/utils/gc/gc';
import { addSchemaIndexFields } from '@shell/plugins/steve/schema.utils';
import { addParam } from '@shell/utils/url';
import { conditionalDepaginate } from '@shell/store/type-map.utils';

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

export default {
  request() {
    throw new Error('Not Implemented');
  },

  loadSchemas,

  // Load a page of data for a given type
  // Used for incremental loading when enabled
  async loadDataPage(ctx, { type, opt }) {
    const { getters, commit, dispatch } = ctx;

    type = getters.normalizeType(type);

    // if there's no registered type, then register it so
    // that we don't have issues on 'loadAdd' mutation
    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    const loadCount = getters['loadCounter'](type);

    try {
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

      if (res.pagination?.next) {
        dispatch('loadDataPage', {
          type,
          opt: {
            ...opt,
            url: res.pagination?.next
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
    opt.url = getters.urlFor(type, null, opt);
    opt.stream = opt.stream !== false && load !== _NONE;
    opt.depaginate = conditionalDepaginate(typeOptions?.depaginate, { ctx, args: { type, opt } });

    let skipHaveAll = false;

    // if it's incremental loading, we do two parallel requests
    // on for a limit of 100, to quickly show data
    // another one with 1st page of the subset of the resource we are fetching
    // the default is 4 pages, but it can be changed on mixin/resource-fetch.js
    let pageFetchOpts;

    if (opt.incremental) {
      commit('incrementLoadCounter', type);

      if (opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', true, { root: true });
      }

      pageFetchOpts = {
        ...opt,
        url: addParam(opt.url, 'limit', `${ opt.incremental }`),
      };

      // this is where we "hijack" the limit for the dispatch('request') some lines below
      // and therefore have 2 initial requests in parallel
      opt.url = addParam(opt.url, 'limit', '100');
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
        dispatch('loadDataPage', { type, opt: pageFetchOpts });
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
   *
   * @param {*} ctx
   * @param { {type: string, opt: ActionFindPageArgs} } opt
   */
  async findPage(ctx, { type, opt }) {
    const { getters, commit, dispatch } = ctx;

    opt = opt || {};

    if (!opt.pagination) {
      console.error('Attempting to find a page for a resource but no pagination settings supplied', type); // eslint-disable-line no-console

      return;
    }

    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    // No need to request the resources if we have them already
    if (!opt.transient && !opt.force && getters['havePaginatedPage'](type, opt)) {
      return findAllGetter(getters, type, opt);
    }

    console.log(`Find Page: [${ ctx.state.config.namespace }] ${ type }. Page: ${ opt.pagination.page }. Size: ${ opt.pagination.pageSize }`); // eslint-disable-line no-console
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

    await dispatch('unwatch', {
      type,
      all: true,
    });

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
        data: out.data,
        pagination,
      });
    }

    if (opt.hasManualRefresh) {
      dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
    }

    garbageCollect.gcUpdateLastAccessed(ctx, type);

    return opt.transient ? {
      data: out.data,
      pagination
    } : findAllGetter(getters, type, opt);
  },

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
    if ( opt.force !== true && getters['haveSelector'](type, selector) ) {
      return getters.matching( type, selector, namespace );
    }

    const typeOptions = rootGetters['type-map/optionsFor'](type);

    opt = opt || {};
    opt.labelSelector = selector;
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

    return getters.matching( type, selector, namespace );
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
        return out;
      }
    }

    opt = opt || {};
    opt.url = getters.urlFor(type, id, opt);

    const res = await dispatch('request', { opt, type });

    await dispatch('load', { data: res });

    if ( opt.watch !== false ) {
      const watchMsg = {
        type,
        id,
        // Although not used by sockets, we need this for when resyncWatch calls find... which needs namespace to construct the url
        namespace: opt.namespaced,
        // Override the revision. Used in cases where we need to avoid using the resource's own revision which would be `too old`.
        // For the above case opt.revision will be `null`. If left as `undefined` the subscribe mechanism will try to determine a revision
        // from resources in store (which would be this one, with the too old revision)
        revision:  typeof opt.revision !== 'undefined' ? opt.revision : res?.metadata?.resourceVersion,
        force:     opt.forceWatch === true,
      };

      const idx = id.indexOf('/');

      if ( idx > 0 ) {
        watchMsg.namespace = id.substr(0, idx);
        watchMsg.id = id.substr(idx + 1);
      }

      dispatch('watch', watchMsg);
    }

    out = getters.byId(type, id);

    garbageCollect.gcUpdateLastAccessed(ctx, type);

    return out;
  },

  load(ctx, { data, existing }) {
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
      existing
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

  // Forget a type in the store
  // Remove all entries for that type and stop watching it
  forgetType({ commit, dispatch, state }, type) {
    state.started
      .filter((entry) => entry.type === type)
      .forEach((entry) => dispatch('unwatch', entry));

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
