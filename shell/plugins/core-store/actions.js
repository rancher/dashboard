import merge from 'lodash/merge';

import { SCHEMA } from '@shell/config/types';
import { SPOOFED_API_PREFIX, SPOOFED_PREFIX } from '@shell/store/type-map';
import { createYaml } from '@shell/utils/create-yaml';
import { classify } from '@shell/plugins/core-store/classify';
import { normalizeType } from './normalize';

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

export default {
  request() {
    throw new Error('Not Implemented');
  },

  async loadSchemas(ctx, watch = true) {
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

    if ( opt.force !== true && getters['haveAll'](type) ) {
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

    console.log(`Find All: [${ ctx.state.config.namespace }] ${ type }`); // eslint-disable-line no-console
    opt = opt || {};
    opt.url = getters.urlFor(type, null, opt);
    opt.stream = opt.stream !== false && load !== _NONE;
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
      return Promise.reject(e);
    }

    if ( load === _NONE ) {
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
          data: out.data
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

    return all;
  },

  async findMatching(ctx, { type, selector, opt }) {
    const { getters, commit, dispatch } = ctx;

    opt = opt || {};
    console.log(`Find Matching: [${ ctx.state.config.namespace }] ${ type }`, selector); // eslint-disable-line no-console
    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }
    if ( opt.force !== true && getters['haveSelector'](type, selector) ) {
      return getters.matching( type, selector );
    }

    opt = opt || {};

    opt.filter = opt.filter || {};
    opt.filter['labelSelector'] = selector;

    opt.url = getters.urlFor(type, null, opt);

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

    return getters.matching( type, selector );
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

  createPopulated(ctx, userData) {
    const data = ctx.getters['defaultFor'](userData.type);

    merge(data, userData);

    return classify(ctx, data);
  },

  clone(ctx, { resource } = {}) {
    return classify(ctx, resource.toJSON(), true);
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
  }
};
