import { LOGGING } from '@/config/types';
import uniq from 'lodash/uniq';
import Flow from './logging.banzaicloud.io.flow';

export default {
  ...Flow,

  allOutputs() {
    return this.$rootGetters['cluster/all'](LOGGING.CLUSTER_OUTPUT) || [];
  },

  outputs() {
    const outputRefs = this?.spec?.globalOutputRefs || this?.spec?.outputRefs || [];

    return this.allOutputs.filter(output => outputRefs.includes(output.name));
  },

  outputProviders() {
    const duplicatedProviders = this.outputs
      .flatMap(output => output.providers);

    return uniq(duplicatedProviders) || [];
  },

  customValidationRules() {
    return [
      {
        path:           'spec',
        validators:     ['flowOutput'],
      },
    ];
  },
};
