import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';
import { KUBEWARDEN_PRODUCT_NAME } from '../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const kubewardenFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { kubewardenState: true };
    },

    actions:   { ...actions },
    getters:   { ...getters },
    mutations: { ...mutations }
  };
};

const config: CoreStoreConfig = { namespace: KUBEWARDEN_PRODUCT_NAME };

export default {
  specifics: kubewardenFactory(),
  config
};
