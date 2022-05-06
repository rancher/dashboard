import Vue from 'vue';

import { isArray } from '@shell/utils/array';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';
import {
  mutations as subscribeMutations,
  actions as subscribeActions,
  getters as subscribeGetters
} from './subscribe';
import { classify } from './classify';
import { keyFieldFor } from './normalize';

function SteveFactory(namespace, baseUrl) {
  return {
    strict:     false,
    namespaced: true,

    state() {
      return {
        config: {
          baseUrl,
          namespace,
        },
        types:            {},
        socket:           null,
        queue:            [], // For change event coalescing
        wantSocket:       false,
        debugSocket:      false,
        allowStreaming:   true,
        pendingFrames:    [],
        deferredRequests: {},
        started:          [],
        inError:          {},
      };
    },

    getters: {
      ...getters,
      ...subscribeGetters
    },

    mutations: {
      ...mutations,
      ...subscribeMutations,
    },
    actions: {
      ...actions,
      ...subscribeActions
    },
  };
}

export default (config = {}) => {
  const namespace = config.namespace || '';

  config.baseUrl = config.baseUrl || `/${ namespace }`;

  return function(store) {
    const inst = SteveFactory(namespace, config.baseUrl);

    store.registerModule(namespace, inst);
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
        const keyField = keyFieldFor(type);
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
            const keyField = keyFieldFor(type);
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
