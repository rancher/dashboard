import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

import { PRODUCT_NAME } from '../../config/harvester';

import { SteveFactory, steveStoreInit } from '../../../../shell/plugins/steve/index';

const harvesterFactory = (): CoreStoreSpecifics => {
  const steveFactory = SteveFactory();

  steveFactory.getters = {
    ...steveFactory.getters,
    ...getters,
  };

  steveFactory.mutations = {
    ...steveFactory.mutations,
    ...mutations,
  };

  steveFactory.actions = {
    ...steveFactory.actions,
    ...actions,
  };

  return steveFactory;
};
const config: CoreStoreConfig = {
  namespace:      PRODUCT_NAME,
  isClusterStore: true
};

export default {
  specifics: harvesterFactory(),
  config,
  init:      steveStoreInit
};
