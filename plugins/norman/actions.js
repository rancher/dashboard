import { normalizeType } from './normalize';
import { proxyFor } from './resource-proxy';
import { SCHEMA } from '@/utils/types';

export default {
  request({ dispatch }, opt) {
    // @TODO queue/defer duplicate requests

    opt.depaginate = opt.depaginate !== false;

    return this.$axios(opt).then((res) => {
      let out = res.data;

      if ( res.status === 204 ) {
        return;
      }

      if ( typeof out !== 'object' ) {
        out = { data: out };
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

      Object.defineProperties(out, {
        _status:     { value: res.status },
        _statusText: { value: res.statusText },
        _headers:    { value: res.headers },
        _req:        { value: res.request },
      });

      return out;
    }).catch((err) => {
      if ( err && err.response && err.response.status === 401 ) {
        dispatch('auth/logout', { root: true });
      }
    });
  },

  async loadSchemas(ctx) {
    const { getters, dispatch, commit } = ctx;
    const res = await dispatch('findAll', { type: SCHEMA, opt: { url: '/v1/schemas', load: false } });

    res.forEach((schema) => {
      schema._id = normalizeType(schema.id);
    });

    commit('registerType', SCHEMA);
    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res
    });

    const all = getters.all(SCHEMA);

    return all;
  },

  async findAll(ctx, { type, opt }) {
    const { getters, commit, dispatch } = ctx;

    console.log('Find All', type);
    type = getters.normalizeType(type);

    if ( !getters.hasType(type) ) {
      commit('registerType', type);
    }

    if ( getters['haveAll'](type) ) {
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

    dispatch('watchType', { type });

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

    type = normalizeType(type);

    console.log('Find', type, id);

    const existing = getters.byId(type, id);

    if ( existing ) {
      return existing;
    }

    opt = opt || {};
    opt.url = getters.urlFor(type, id, opt);

    const res = await dispatch('request', opt);

    if ( !getters.hasType(type) ) {
      commit('registerType', type);
    }

    commit('load', {
      ctx,
      type,
      resource: res,
    });

    const neu = getters.byId(type, id);

    return neu;
  },

  create(ctx, data) {
    return proxyFor(ctx, data);
  },

  schemaFor({ getters }, type) {
    return getters['schemaFor'](type);
  }
};
