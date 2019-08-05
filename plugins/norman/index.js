import { clear, addObjects } from '@/utils/array';

export const Norman = {
  namespaced: true,

  state() {
    return {
      types:   {},
      config: { baseUrl: '/v1' },
    };
  },

  getters: {
    all(state, type) {
      return state.types.list;
    },

    byId(state, type, id) {

    },

    hasType(state, type) {
      type = normalizeType(type);

      return !!state.types[type];
    }
  },

  mutations: {
    setConfig(state, config) {
      Object.assign(state.config, config);
    },

    registerType(state, type) {
      if ( !state.types[type] ) {
        state.types[type] = {
          list:    [],
          map:     new Map(),
          haveAll: false,
        };
      }
    },

    loadAll(state, type, data) {
      const entry = state.types[type];

      clear(entry.list);
      entry.map.clear();

      addObjects(entry.list, data);
      for ( let i = 0 ; i < data.length ; i++ ) {
        entry.map.set(data[i].id, data[i]);
      }

      entry.haveAll = true;
    }
  },

  actions: {
    request({ dispatch }, opt) {
      // @TODO queue/defer duplicat requests

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
      });
    },

    async findAll({ state, commit, dispatch }, { type, opt }) {
      type = normalizeType(type);
      opt = opt || {};
      if ( !opt.url ) {
        opt.url = type;
      }

      const res = await dispatch('request', opt);

      if ( !state.getters.hasType(type) ) {
        commit('registerType', type);
      }

      await dispatch('loadAll', type, res.data);
    },

    async loadSchemas({ dispatch }) {
      console.log('v1/loadSchemas starting');
      await dispatch('findAll', { type: 'schema', opt: { url: '/schemas' } });
      console.log('v1/loadSchemas done');

      debugger;
    }
  },

  localThing() {
    debugger;
  }
};

export function normalizeType(type) {
  type = (type || '').toLowerCase();

  return type;
}

export default (config = {}) => {
  const namespace = config.namespace || '';
  const preserveState = config.preserveState !== false;

  return function(store) {
    console.log('Norman init');
    store.registerModule(namespace, Norman, { preserveState });
    store.commit(`${ namespace }/applyConfig`, config);
  };
};
