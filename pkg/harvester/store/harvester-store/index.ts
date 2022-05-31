import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

import { PRODUCT_NAME } from '../../types';

const harvesterFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config: CoreStoreConfig = {
  namespace:      PRODUCT_NAME,
  isClusterStore: true
};

/**
 * `epinio` store is like a `cluster` store...
 * .. it contains epinio instance specific resources that should be setup/reset when navigating to/away from an epinio instances
 */
export default {
  specifics: harvesterFactory(),
  config
};
