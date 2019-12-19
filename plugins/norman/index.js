import Vue from 'vue';

import actions from './actions';
import getters from './getters';
import mutations from './mutations';
import { mutations as subscribeMutations, actions as subscribeActions } from './subscribe';
import { proxyFor } from './resource-proxy';
import { keyFieldFor } from './normalize';
import { isArray } from '@/utils/array';

function NormanFactory(namespace, baseUrl) {
  return {
    namespaced: true,

    state() {
      return {
        config: {
          baseUrl,
          namespace
        },
        types:  {},
        socket: null,
      };
    },

    getters,
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
    const inst = NormanFactory(namespace, config.baseUrl);

    store.registerModule(namespace, inst);
    store.commit(`${ namespace }/applyConfig`, config);

    if ( !process.client || !window.__NUXT__ ) {
      return;
    }

    store.subscribe(({ type }, state) => {
      if ( type === 'auth/loggedOut' ) {
        store.dispatch(`${ namespace }/unsubscribe`);
      }
    });

    const module = store._modules.root._children[namespace];
    const fromServer = window.__NUXT__;

    module.context.rootGetters = store.getters;

    // Turn all the objects in the store from the server into proxies
    const state = fromServer.state[namespace];

    Object.keys(state.types).forEach((type) => {
      const keyField = keyFieldFor(type);
      const cache = state.types[type];
      const map = new Map();

      for ( let i = 0 ; i < cache.list.length ; i++ ) {
        const proxy = proxyFor(module.context, cache.list[i]);

        cache.list[i] = proxy;
        map.set(proxy[keyField], proxy);
      }

      Vue.set(cache, 'map', map);
      Vue.set(state.types, type, state.types[type]);
    });

    // Turn all the objects in data from the server into the object from the store;
    fromServer.data = recurse(fromServer.data);

    function recurse(obj, parent, key) {
      if ( isArray(obj) ) {
        const rehydrateKey = `__rehydrateAll__${ key }`;

        if ( parent && key && parent[rehydrateKey] ) {
          const type = parent[rehydrateKey];

          delete parent[rehydrateKey];

          const cache = state.types[type];

          if ( cache ) {
            return cache.list;
          }
        } else {
          return obj.map(x => recurse(x));
        }
      } else if ( obj && typeof obj === 'object' ) {
        if ( obj.__rehydrate ) {
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

          delete obj.__rehydrate;

          // Or just return a proxied object
          return proxyFor(module.context, obj);
        } else {
          for ( const k of Object.keys(obj) ) {
            obj[k] = recurse(obj[k], obj, k);
          }
        }
      }

      return obj;
    }
  };
};
