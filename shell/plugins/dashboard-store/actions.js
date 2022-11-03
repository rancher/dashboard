import merge from 'lodash/merge';

import { SCHEMA } from '@shell/config/types';
import { SPOOFED_API_PREFIX, SPOOFED_PREFIX } from '@shell/store/type-map';
import { createYaml } from '@shell/utils/create-yaml';
import { classify } from '@shell/plugins/dashboard-store/classify';
import { normalizeType } from './normalize';
import garbageCollect from '@shell/utils/gc/gc';

export const _ALL = 'all';
export const _MERGE = 'merge';
export const _MULTI = 'multi';
export const _ALL_IF_AUTHED = 'allIfAuthed';
export const _NONE = 'none';

const SCHEMA_CHECK_RETRIES = 15;
const SCHEMA_CHECK_RETRY_LOG = 10;

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

  res.data.forEach((schema) => {
    schema._id = normalizeType(schema.id);
    schema._group = normalizeType(schema.attributes?.group);
  });

  commit('loadAll', {
    ctx,
    type: SCHEMA,
    data: res.data
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

export default {
  request() {
    throw new Error('Not Implemented');
  },

  loadSchemas,

  // Load a page of data for a given type
  // Used for incremental loading when enabled
  async loadDataPage(ctx, { type, opt, namespace }) {
    const { getters, commit, dispatch } = ctx;

    type = getters.normalizeType(type);

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
          },
          namespace
        });
      } else {
      // We have everything!
        if (opt.hasManualRefresh) {
          dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
        }
        if (namespace) {
          commit('setHaveNamespace', { type, namespace });
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

  async findAll(ctx, { type, opt }) {
    const {
      getters, commit, dispatch, rootGetters
    } = ctx;

    opt = opt || {};
    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    if ( opt.force !== true && (getters['haveAll'](type) || getters['haveAllNamespace'](type, opt.namespaced))) {
      const args = {
        type,
        revision:  '',
        namespace: opt.watchNamespace
      };

      // if we are coming from a resource that wasn't watched
      // but for which we have results already, just return the results but start watching it
      if (opt.watch !== false && !getters.watchStarted(args)) {
        dispatch('watch', args);
      }

      return getters.all(type);
    }

    let load = (opt.load === undefined ? _ALL : opt.load);

    if ( opt.load === false || opt.load === _NONE ) {
      load = _NONE;
    } else if ( opt.load === _ALL_IF_AUTHED ) {
      const header = rootGetters['auth/fromHeader'];

      if ( `${ header }` === 'true' || `${ header }` === 'none' ) {
        load = _ALL;
      } else {
        load = _MULTI;
      }
    }

    const typeOptions = rootGetters['type-map/optionsFor'](type);

    console.log(`Find All: [${ ctx.state.config.namespace }] ${ type }`); // eslint-disable-line no-console
    opt = opt || {};
    opt.url = getters.urlFor(type, null, opt);
    opt.stream = opt.stream !== false && load !== _NONE;
    opt.depaginate = typeOptions?.depaginate;

    let skipHaveAll = false;

    // if it's incremental loading, we do two parallel requests
    // on for a limit of 100, to quickly show data
    // another one with 1st page of the subset of the resource we are fetching
    // the default is 4 pages, but it can be changed on mixin/resource-fetch.js
    if (opt.incremental) {
      commit('incrementLoadCounter', type);

      if (opt.hasManualRefresh) {
        dispatch('resource-fetch/updateManualRefreshIsLoading', true, { root: true });
      }

      const pageFetchOpts = {
        ...opt,
        url: `${ opt.url }?limit=${ opt.incremental }`
      };

      // this is where we "hijack" the limit for the dispatch('request') some lines below
      // and therefore have 2 initial requests in parallel
      opt.url = `${ opt.url }?limit=100`;
      skipHaveAll = true;

      // since we are forcing a request, clear the haveAll
      // needed for the resource-fetch mixin, otherwise the incremental indicator
      // won't pop-up again when manual refreshing
      if (opt.force) {
        commit('forgetType', type);
      }

      dispatch('loadDataPage', {
        type, opt: pageFetchOpts, namespace: opt.namespaced
      });
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
          data:      out.data,
          skipHaveAll,
          namespace: opt.namespaced,
        });
      }
    }

    if ( opt.watch !== false ) {
      dispatch('watch', {
        type,
        revision:  out.revision,
        namespace: opt.watchNamespace
      });
    }

    const all = getters.all(type);

    if (!opt.incremental && opt.hasManualRefresh) {
      dispatch('resource-fetch/updateManualRefreshIsLoading', false, { root: true });
    }

    garbageCollect.gcUpdateLastAccessed(ctx, type);

    return all;
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

    opt.filter = opt.filter || {};
    opt.filter['labelSelector'] = selector;

    opt.url = getters.urlFor(type, null, opt);
    opt.depaginate = typeOptions?.depaginate;

    const res = await dispatch('request', { opt, type });

    if ( opt.load === false ) {
      return res.data;
    }

    commit('loadSelector', {
      ctx,
      type,
      entries: res.data,
      selector
    });

    if ( opt.watch !== false ) {
      dispatch('watch', {
        type,
        selector,
        revision: res.revision
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
        revision: res?.metadata?.resourceVersion,
        force:    opt.forceWatch === true,
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
    return data.map(d => classify(ctx, d));
  },

  createPopulated(ctx, userData) {
    const data = ctx.getters['defaultFor'](userData.type);

    merge(data, userData);

    return classify(ctx, data);
  },

  clone(ctx, { resource } = {}) {
    return classify(ctx, resource.toJSON(), true);
  },

  // Forget a type in the store
  // Remove all entries for that type and stop watching it
  forgetType({ commit, getters, dispatch }, type) {
    const obj = {
      type,
      stop: true, // Stops the watch on a type
    };

    if (getters['schemaFor'](type) && getters['watchStarted'](obj)) {
      // Set that we don't want to watch this type
      // Otherwise, the dispatch to unwatch below will just cause a re-watch when we
      // detect the stop message from the backend over the web socket
      commit('setWatchStopped', obj);
      dispatch('watch', obj); // Ask the backend to stop watching the type
      // Make sure anything in the pending queue for the type is removed, since we've now removed the type
      commit('clearFromQueue', type);
    }

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

  // Wait for a schema that is expected to exist that may not have been loaded yet (for instance when loadCluster is still running).
  async waitForSchema({ getters, dispatch }, { type }) {
    let tries = SCHEMA_CHECK_RETRIES;
    let schema = null;

    while (!schema && tries > 0) {
      schema = getters['schemaFor'](type);

      if (!schema) {
        if (tries === SCHEMA_CHECK_RETRY_LOG) {
          console.warn(`Schema for ${ type } not available... retrying...`); // eslint-disable-line no-console
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        tries--;
      }
    }

    if (tries === 0) {
      // Ran out of tries - fetch the schemas again
      console.warn(`Schema for ${ type } still unavailable... loading schemas again...`); // eslint-disable-line no-console
      await dispatch('loadSchemas', true);
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
