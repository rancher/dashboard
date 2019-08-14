import actions from './actions';
import getters from './getters';
import mutations from './mutations';
import events from './events';

export const Norman = {
  namespaced: true,

  state() {
    return {
      config: { baseUrl: '' },
      types:   {},
      socket:    {
        status: 'disconnected',
        count:  0,
      }
    };
  },

  getters,
  mutations,
  actions: {
    ...actions,
    ...events
  },
};

export default (config = {}) => {
  const namespace = config.namespace || '';

  config.baseUrl = config.baseUrl || `/${ namespace }`;

  // const preserveState = config.preserveState !== false;

  return function(store) {
    store.registerModule(namespace, Norman);
    store.commit(`${ namespace }/applyConfig`, config);
  };
};
