import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

import { PRODUCT_NAME } from '../../config/harvester';

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

export default {
  specifics: harvesterFactory(),
  config
};
