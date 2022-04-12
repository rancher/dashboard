import Vue from 'vue';

import { isArray } from '@shell/utils/array';
import { classify } from '@shell/plugins/core-store/classify';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

export const coreStoreModule = {
  strict:     false,
  namespaced: true,

  state() {
    return { ...coreStoreState() };
  },

  getters: { ...getters },

  mutations: { ...mutations },
  actions:   { ...actions },
};

export const coreStoreState = (namespace, baseUrl, isClusterStore) => ({
  config: {
    baseUrl,
    namespace,
    isClusterStore
  },
  types: {},
});

export default (vuexModule, config) => {
  const namespace = config.namespace || '';

  return function(store) {
    // const inst = SteveFactory(namespace, config.baseUrl);

    store.registerModule(namespace, vuexModule);
    store.commit(`${ namespace }/applyConfig`, config);

    if ( !process.client || !window.__NUXT__ ) {
      return;
    }

    // store.subscribe(({ type }, state) => {
    //   if ( type === 'auth/loggedOut' ) {
    //     store.dispatch(`${ namespace }/unsubscribe`);
    //   }
    // });

    const module = store._modules.root._children[namespace];
    const fromServer = window.__NUXT__;

    const ctx = new Proxy(module.context, {
      get(obj, key) {
        if ( key === 'rootGetters' ) {
          return store.getters;
        }

        return obj[key];
      }
    });

    // Turn all the objects in the store from the server into proxies
    const state = fromServer?.state?.[namespace];

    if ( state ) {
      Object.keys(state.types).forEach((type) => {
        const keyField = store.getters[`${ namespace }/keyFieldForType`](type);
        const cache = state.types[type];
        const map = new Map();

        for ( let i = 0 ; i < cache.list.length ; i++ ) {
          const proxy = classify(ctx, cache.list[i]);

          cache.list[i] = proxy;
          map.set(proxy[keyField], proxy);
        }

        Vue.set(cache, 'map', map);
        Vue.set(state.types, type, state.types[type]);
      });
    }

    // Turn all the objects in data from the server into the object from the store;
    if ( state && fromServer?.data ) {
      fromServer.data = recurse(fromServer.data);
    }

    if ( state && fromServer?.fetch ) {
      fromServer.fetch = recurse(fromServer.fetch);
    }

    function recurse(obj, parent, key) {
      if ( isArray(obj) ) {
        const rehydrateKey = `__rehydrateAll__${ key }`;

        if ( parent && key && parent[rehydrateKey] ) {
          const [ns, type] = parent[rehydrateKey].split('/', 2);

          if ( ns === namespace ) {
            // Don't delete the key, so that all the stores go through this path,
            // and then do nothing if they are not for this namespace,
            // instead of doing the else obj.map()
            // and breaking the "live" reference to the cache.list array
            // delete parent[rehydrateKey];

            const cache = state.types[type];

            if ( cache ) {
              return cache.list;
            }
          }
        } else {
          return obj.map(x => recurse(x));
        }
      } else if ( obj && typeof obj === 'object' ) {
        if ( obj.__rehydrate ) {
          if ( obj.__rehydrate !== namespace ) {
            // Ignore types that are for another vuex namespace
            return obj;
          }

          const type = obj.type;
          const cache = state.types[type];

          if ( cache && !obj.__clone ) {
            const map = cache.map;
            const keyField = store.getters[`${ namespace }/keyFieldForType`](type);
            const entry = map.get(obj[keyField]);

            // Map the object to the same instance in the store if possible
            if ( entry ) {
              return entry;
            }
          }

          // Or just return a proxied object
          delete obj.__rehydrate;

          return classify(ctx, obj);
        } else {
          for ( const k of Object.keys(obj) ) {
            if ( k.startsWith('__rehydrateAll__') ) {
              continue;
            }

            if ( isArray(obj[k]) || typeof obj[k] === 'object' ) {
              obj[k] = recurse(obj[k], obj, k);
            }
          }
        }
      }

      return obj;
    }
  };
};
