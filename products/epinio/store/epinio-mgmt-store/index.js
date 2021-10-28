import coreStore, { coreStoreModule, coreStoreState } from '@/plugins/core-store/index';
import { EPINIO_MGMT_STORE } from '@/products/epinio/types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export default () => {
  return coreStore(
    {
      ...coreStoreModule,

      state() {
        return {
          managementReady: false,

          ...coreStoreState(EPINIO_MGMT_STORE, '')
        };
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
      }
    },
    { namespace: EPINIO_MGMT_STORE },
  );
};
