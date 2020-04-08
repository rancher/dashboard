import https from 'https';
import { cloneDeep } from 'lodash';
import { normalizeType } from './normalize';
import { proxyFor, SELF } from './resource-proxy';
import { SCHEMA, WORKLOAD } from '@/config/types';

export default {
  request({ dispatch }, opt) {
    // @TODO queue/defer duplicate requests
    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

    opt.httpsAgent = new https.Agent({ rejectUnauthorized: false });

    return this.$axios(opt).then((res) => {
      if ( res.status === 204 ) {
        return;
      }

      if ( opt.depaginate ) {
        // @TODO
        /*
        return new Promise((resolve, reject) => {
          const next = res.pagination.next;
          if (!next ) [
            return resolve();
          }

          dispatch('request')
        });
        */
      }

      return responseObject(res);
    }).catch((err) => {
      if ( !err || !err.response ) {
        return Promise.reject(err);
      }

      const res = err.response;

      // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
      if ( opt.redirectUnauthorized !== false && process.client && res.status === 401 ) {
        return dispatch('auth/logout', opt.logoutOnError, { root: true });
      }

      if ( typeof res.data !== 'undefined' ) {
        return Promise.reject(responseObject(res));
      }

      return Promise.reject(err);
    });

    function responseObject(res) {
      let out = res.data;

      if ( typeof out !== 'object' ) {
        out = { data: out };
      }

      Object.defineProperties(out, {
        _status:     { value: res.status },
        _statusText: { value: res.statusText },
        _headers:    { value: res.headers },
        _req:        { value: res.request },
      });

      return out;
    }
  },

  async loadSchemas(ctx, watch = true) {
    const { getters, dispatch, commit } = ctx;
    const res = await dispatch('findAll', { type: SCHEMA, opt: { url: 'schemas', load: false } });

    res.forEach((schema) => {
      schema._id = normalizeType(schema.id);
    });

    commit('registerType', SCHEMA);
    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res
    });

    if ( watch !== false ) {
      dispatch('watchType', { type: SCHEMA });
    }

    const all = getters.all(SCHEMA);

    return all;
  },

  async findAll(ctx, { type, opt }) {
    const { getters, commit, dispatch } = ctx;

    opt = opt || {};
    console.log('Find All', type);
    type = getters.normalizeType(type);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    if ( opt.force !== true && getters['haveAll'](type) ) {
      return getters.all(type);
    }

    opt = opt || {};
    opt.url = getters.urlFor(type, null, opt);

    const res = await dispatch('request', opt);

    if ( opt.load === false ) {
      return res.data;
    }

    commit('loadAll', {
      ctx,
      type,
      data: res.data
    });

    if ( opt.watch !== false ) {
      dispatch('watchType', { type });
    }

    const all = getters.all(type);

    return all;
  },

  // opt:
  //  filter: Filter by fields, e.g. {field: value, anotherField: anotherValue} (default: none)
  //  limit: Number of reqords to return per page (default: 1000)
  //  sortBy: Sort by field
  //  sortOrder: asc or desc
  //  url: Use this specific URL instead of looking up the URL for the type/id.  This should only be used for bootstraping schemas on startup.
  //  @TODO depaginate: If the response is paginated, retrieve all the pages. (default: true)
  async find(ctx, { type, id, opt }) {
    const { getters, commit, dispatch } = ctx;

    opt = opt || {};

    type = normalizeType(type);

    console.log('Find', type, id);
    let out;

    if ( opt.force !== true ) {
      out = getters.byId(type, id);

      if ( out ) {
        return out;
      }
    }

    opt = opt || {};
    opt.url = getters.urlFor(type, id, opt);

    const res = await dispatch('request', opt);

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type);
    }

    await dispatch('load', { data: res });

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

    commit('load', {
      ctx,
      type,
      data,
      existing
    });

    return getters['byId'](type, data.id || existing.id);
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
    return proxyFor(ctx, data);
  },

  clone(ctx, { resource } = {}) {
    const copy = cloneDeep(resource[SELF]);

    return proxyFor(ctx, copy, true);
  },

  promptRemove({ commit, state }, resources = []) {
    commit('action-menu/togglePromptRemove', resources, { root: true });
  }
};
