import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

import { EXAMPLE_STORE } from '../../types';

const exampleStoreFactory = (): CoreStoreSpecifics => {
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
  namespace:      EXAMPLE_STORE,
  isClusterStore: true,
};

/**
 * `example` store is like a `cluster` store...
 * .. it contains cluster specific resources that should be setup/reset when navigating to/away from an example 'cluster'
 */
export default {
  specifics: exampleStoreFactory(),
  config
};
