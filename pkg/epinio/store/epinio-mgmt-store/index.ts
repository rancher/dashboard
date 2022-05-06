import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import { EPINIO_MGMT_STORE } from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const epinioMgmtFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { managementReady: false };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config: CoreStoreConfig = { namespace: EPINIO_MGMT_STORE };

/**
 * `epiniomgmt` store contains resources that aren't epinio instance specific, for example the list of epinio instances
 */
export default {
  specifics: epinioMgmtFactory(),
  config
};
