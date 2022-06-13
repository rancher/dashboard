import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import { ELEMENTAL_STORE } from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const elementalFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { someElementalState: true };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config: CoreStoreConfig = { namespace: ELEMENTAL_STORE };

/**
 * `epiniomgmt` store contains resources that aren't epinio instance specific, for example the list of epinio instances
 */
export default {
  specifics: elementalFactory(),
  config
};
