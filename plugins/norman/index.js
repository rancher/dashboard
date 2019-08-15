import actions from './actions';
import getters from './getters';
import mutations from './mutations';
import events from './events';

function NormanFactory(namespace) {
  return {
    namespaced: true,

    state() {
      return {
        config: {
          baseUrl: `/${ namespace }`,
          namespace
        },
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
}

export default (config = {}) => {
  const namespace = config.namespace || '';

  config.baseUrl = config.baseUrl || `/${ namespace }`;

  return function(store) {
    store.registerModule(namespace, NormanFactory(namespace));
    store.commit(`${ namespace }/applyConfig`, config);
  };
};
