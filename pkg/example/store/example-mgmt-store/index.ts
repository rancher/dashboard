import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import { EXAMPLE_MGMT_STORE } from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const exampleMgmtFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { managementReady: false };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config: CoreStoreConfig = { namespace: EXAMPLE_MGMT_STORE };

/**
 * `example-mgmt-store` store contains resources that aren't example 'cluster' specific, for example the list of clusters
 */
export default {
  specifics: exampleMgmtFactory(),
  config
};
