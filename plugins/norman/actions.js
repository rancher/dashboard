import { normalizeType } from './normalize';
import { SCHEMA } from '@/utils/types';

export default {
  request({ dispatch }, opt) {
    // @TODO queue/defer duplicate requests

    opt.depaginate = opt.depaginate !== false;

    return this.$axios(opt).then((res) => {
      const out = res.data;

      if ( res.status === 204 ) {
        return;
      }

      if ( typeof out !== 'object' ) {
        return out;
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
    });
  },

  rehydrateProxies({ state, commit, dispatch }) {
    if ( !process.client ) {
      return;
    }

    return commit('rehydrateProxies', { dispatch });
  },

  async loadSchemas({
    getters, dispatch, commit, state
  }) {
    const res = await dispatch('findAll', { type: SCHEMA, opt: { url: '/v1/schemas', load: false } });

    res.forEach((schema) => {
      schema._id = normalizeType(schema.id);

      // @TODO
      // const links = schema.links;
      // for ( const k in links ) {
      //  links[k] = links[k].replace('http://localhost:8989', 'https://localhost:8005');
      // }
    });

    commit('registerType', SCHEMA);
    commit('loadAll', {
      type: SCHEMA, data: res, dispatch
    });

    const all = getters.all(SCHEMA);

    return all;
  },

  async findAll({ getters, commit, dispatch }, { type, opt }) {
    console.log('Find All', type);
    type = getters.normalizeType(type);

    if ( getters['haveAll'](type) ) {
      return getters['all'](type);
    }

    opt = opt || {};
    opt.url = getters.urlFor(type, null, opt);

    const res = await dispatch('request', opt);

    if ( opt.load === false ) {
      return res.data;
    }

    if ( !getters.hasType(type) ) {
      commit('registerType', type);
    }

    commit('loadAll', {
      type, data: res.data, dispatch
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
  async find({ getters, commit, dispatch }, { type, id, opt }) {
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
      type, resource: res, dispatch
    });

    const neu = getters.byId(type, id);

    return neu;
  },
};
