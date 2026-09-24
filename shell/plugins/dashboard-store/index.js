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
  types:              {},
  savedCounts:        {}, // Saved counts for resource types (from paginated API called where marked)
  // The most recent page request per type and requester - see markPageRequest in ./actions.js.
  // Here rather than at module scope so it goes when the store does, on log out.
  latestPageRequests: {},
  // Annotated so `typegen.sh` can emit a declaration for this module; without it
  // declaration emit fails on the private `RawSymbol` type behind `markRaw`.
  $ctx:               /** @type {any} */ (markRaw({})),
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
