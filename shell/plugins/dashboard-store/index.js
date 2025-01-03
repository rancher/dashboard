import actions from './actions';
import getters from './getters';
import mutations from './mutations';
import { markRaw } from 'vue';

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
  $ctx:  markRaw({}),
});

export default (vuexModule, config, init) => {
  const namespace = config.namespace || '';

  return function(store) {
    store.registerModule(namespace, vuexModule);
    store.commit(`${ namespace }/applyConfig`, config);

    const module = store._modules.root._children[namespace];

    const ctx = new Proxy(module.context, {
      get(obj, key) {
        if ( key === 'rootGetters' ) {
          return store.getters;
        }

        return obj[key];
      }
    });

    if (init) {
      init(store, ctx);
    }
  };
};
