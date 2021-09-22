import coreStore, { coreStoreModule, coreStoreState } from '@/plugins/core-store/index';

import {
  mutations as subscribeMutations,
  actions as subscribeActions,
  getters as subscribeGetters
} from './subscribe';

import getters, { STEVE_MODEL_TYPES } from './getters';
import mutations from './mutations';
import actions from './actions';

function SteveFactory(namespace, baseUrl) {
  return {
    ...coreStoreModule,

    state() {
      return {
        ...coreStoreState(namespace, baseUrl),
        socket:       null,
        queue:        [],
        wantSocket:   false,
        debugSocket:  false,
        pendingSends: [],
        started:      [],
        inError:      {},
      };
    },

    getters: {
      ...coreStoreModule.getters,
      ...getters,
      ...subscribeGetters
    },

    mutations: {
      ...coreStoreModule.mutations,
      ...mutations,
      ...subscribeMutations,
    },

    actions: {
      ...coreStoreModule.actions,
      ...actions,
      ...subscribeActions
    },
  };
}

export default (config) => {
  config.namespace = config.namespace || '';

  config.baseUrl = config.baseUrl || `/${ config.namespace }`;

  switch (config.namespace) {
  case 'management':
    config.modelBaseClass = STEVE_MODEL_TYPES.BY_TYPE;
    break;
  case 'rancher':
    config.modelBaseClass = STEVE_MODEL_TYPES.NORMAN;
    break;
  }

  return coreStore(
    SteveFactory(config),
    config,
  );
};
