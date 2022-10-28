import coreStore, { coreStoreModule, coreStoreState } from '@shell/plugins/dashboard-store/index';
import {
  createWorker,
  mutations as subscribeMutations,
  actions as subscribeActions,
  getters as subscribeGetters
} from './subscribe';

import getters, { STEVE_MODEL_TYPES } from './getters';
import mutations from './mutations';
import actions from './actions';

export function SteveFactory(namespace, baseUrl) {
  return {
    ...coreStoreModule,

    state() {
      return {
        ...coreStoreState(namespace, baseUrl),
        socket:           null,
        queue:            [], // For change event coalescing
        wantSocket:       false,
        debugSocket:      false,
        allowStreaming:   true,
        pendingFrames:    [],
        deferredRequests: {},
        started:          [],
        inError:          {},
        podsByNamespace:  {}, // Cache of pods by namespace
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

export const steveStoreInit = (store, ctx) => {
  createWorker(store, ctx);
};

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
    SteveFactory(config.namespace, config.baseUrl),
    config,
    steveStoreInit
  );
};
