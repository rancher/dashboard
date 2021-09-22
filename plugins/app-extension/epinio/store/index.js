import coreStore, { coreStoreModule, coreStoreState } from '@/plugins/core-store/index';
import { EPINIO_PRODUCT_NAME } from '@/plugins/app-extension/epinio/types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

import { actions as subscribeActions } from './subscribe-shims';

function EpinioFactory(namespace, baseUrl) {
  return {
    ...coreStoreModule,

    state() {
      return { ...coreStoreState(namespace, baseUrl) };
    },

    getters: {
      ...coreStoreModule.getters,
      ...getters,
    },

    mutations: {
      ...coreStoreModule.mutations,
      ...mutations,
    },
    actions: {
      ...coreStoreModule.actions,
      ...actions,
      ...subscribeActions
    },
  };
}

export default () => {
  return coreStore(
    EpinioFactory({ namespace: EPINIO_PRODUCT_NAME }),
    {
      namespace: EPINIO_PRODUCT_NAME,
      baseUrl:   `/proxy`
    },
  );
};
