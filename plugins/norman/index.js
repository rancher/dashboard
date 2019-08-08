import Vue from 'vue';
import urlOptions from './urloptions';
import { clear, addObject, addObjects } from '@/utils/array';
import { sortableNumericSuffix } from '@/utils/sort';

const KEY_FIELD_FOR = {
  schema:  '_id',
  default: 'id',
};

export const Norman = {
  namespaced: true,

  state() {
    return {
      types:   {},
      config: { baseUrl: '/v1' },
    };
  },

  getters: {
    all: (state, getters) => (type) => {
      type = getters.normalizeType(type);

      if ( getters.hasType(type) ) {
        return state.types[type].list;
      } else {
        throw new Error(`All of ${ type } is not loaded`);
      }
    },

    byId: (state, getters) => (type, id) => {
      type = getters.normalizeType(type);
      const entry = state.types[type];

      if ( entry ) {
        return entry.map.get(id);
      }
    },

    schemaFor: (state, getters) => (type) => {
      const schemas = state.types['schema'];

      type = normalizeType(type);

      if ( !schemas ) {
        throw new Error("Schemas aren't loaded yet");
      }

      return schemas.map.get(type);
    },

    hasType: (state, getters) => (type) => {
      type = getters.normalizeType(type);

      return !!state.types[type];
    },

    haveAll: (state, getters) => (type) => {
      type = getters.normalizeType(type);
      const entry = state.types[type];

      if ( entry ) {
        return entry.haveAll;
      }

      return false;
    },

    normalizeType: () => (type) => {
      return normalizeType(type);
    },

    urlFor: (state, getters) => (type, id, opt) => {
      opt = opt || {};
      type = getters.normalizeType(type);

      let url = opt.url;

      if ( !url ) {
        const schema = getters.schemaFor(type);

        if ( !schema ) {
          throw new Error(`Unknown schema for type: ${ type }`);
        }

        url = schema.links.collection;
        if ( id ) {
          url += `/${ id }`;
        }
      }

      url = urlOptions(url, opt);

      return url;
    },
  },

  mutations: {
    rehydrateProxies(state) {
      console.log('Rehydrating Proxies:', process.client);
      if ( !process.client ) {
        return;
      }

      Object.keys(state.types).forEach((type) => {
        const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
        const cache = state.types[type];
        const map = new Map();

        for ( let i = 0 ; i < cache.list.length ; i++ ) {
          const proxy = proxyFor(cache.list[i]);

          cache.list[i] = proxy;
          map.set(proxy[keyField], proxy);
        }

        Vue.set(cache, 'map', map);
        Vue.set(state.types, type, state.types[type]);
      });
    },

    applyConfig(state, config) {
      if ( !state.config ) {
        state.config = {};
      }

      Object.assign(state.config, config);
    },

    registerType(state, type) {
      if ( !state.types[type] ) {
        const obj = {
          list:    [],
          haveAll:   false,
        };

        // Not enumerable so they don't get sent back to the client for SSR
        Object.defineProperty(obj, 'map', { value: new Map() });

        state.types[type] = obj;
      }
    },

    loadAll(state, { type, data }) {
      const cache = state.types[type];
      const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];

      clear(cache.list);
      cache.map.clear();

      const proxies = data.map(x => proxyFor(x));

      addObjects(cache.list, proxies);

      for ( let i = 0 ; i < data.length ; i++ ) {
        cache.map.set(data[i][keyField], proxies[i]);
      }

      cache.haveAll = true;
    },

    load(state, resource) {
      const type = normalizeType(resource.type);
      const keyField = KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
      const id = resource[keyField];
      const cache = state.types[type];
      const entry = cache.map.get(id);

      if ( entry ) {
        Object.assign(entry, resource);
      } else {
        const proxy = proxyFor(resource);

        addObject(cache.list, proxy);
        cache.map.set(id, proxy);
      }
    }
  },

  actions: {
    request({ dispatch }, opt) {
      // @TODO queue/defer duplicate requests

      opt.depaginate = opt.depaginate !== false;

      return this.$axios(opt).then((res) => {
        const out = res.data;

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

        Object.defineProperties(out, {
          _status:     { value: res.status },
          _statusText: { value: res.statusText },
          _headers:    { value: res.headers },
          _req:        { value: res.request },
        });

        return out;
      });
    },

    async loadSchemas({
      getters, dispatch, commit, state
    }) {
      console.log('loadSchemas');
      const res = await dispatch('findAll', { type: 'schema', opt: { url: '/v1/schemas', load: false } });

      console.log('loadSchemas 2');

      res.forEach((schema) => {
        schema._id = normalizeType(schema.id);

        // @TODO
        // const links = schema.links;
        // for ( const k in links ) {
        //  links[k] = links[k].replace('http://localhost:8989', 'https://localhost:8005');
        // }
      });

      commit('registerType', 'schema');
      commit('loadAll', { type: 'schema', data: res });

      const all = getters.all('schema');

      return all;
    },

    async findAll({ getters, commit, dispatch }, { type, opt }) {
      console.log('Find All', type, opt);
      type = getters.normalizeType(type);

      if ( getters['haveAll'](type) ) {
        return getters['all'](type);
      }

      opt = opt || {};
      console.log('Before', opt);
      opt.url = getters.urlFor(type, null, opt);
      console.log('After', opt);

      const res = await dispatch('request', opt);

      if ( opt.load === false ) {
        return res.data;
      }

      if ( !getters.hasType(type) ) {
        commit('registerType', type);
      }

      commit('loadAll', { type, data: res.data });

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
      const existing = getters.byId(type, id);

      type = normalizeType(type);

      if ( existing ) {
        return existing;
      }

      opt = opt || {};
      opt.url = getters.urlFor(type, id, opt);

      const res = await dispatch('request', opt);

      if ( !getters.hasType(type) ) {
        commit('registerType', type);
      }

      const neu = commit('load', res.data );

      return neu;
    }
  },
};

export default (config = {}) => {
  const namespace = config.namespace || '';
  // const preserveState = config.preserveState !== false;

  return function(store) {
    store.registerModule(namespace, Norman);
    store.commit(`${ namespace }/applyConfig`, config);
  };
};

function normalizeType(type) {
  type = (type || '').toLowerCase();

  return type;
}

function proxyFor(obj) {
  return new Proxy(obj, {
    get(target, name) {
      if (name === 'displayName') {
        return target.metadata.name || target.id;
      } else if ( name === 'sortName' ) {
        return sortableNumericSuffix(target.metadata.name || target.id).toLowerCase();
      } else if ( name === 'toString' ) {
        return function() {
          return `${ obj.type }:${ obj.id }`;
        };
      }

      return target[name];
    },

    apply(target, thisArg, argumentsList) {
      debugger;
    }
  });
}
