import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import { ELEMENTAL_STORE } from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const elementalFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { createClusterElements: [] };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config: CoreStoreConfig = { namespace: ELEMENTAL_STORE };

export default {
  specifics: elementalFactory(),
  config
};
