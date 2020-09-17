import { LOGGING } from '@/config/types';
import uniq from 'lodash/uniq';

export default {
  allOutputs() {
    return this.$rootGetters['cluster/all'](LOGGING.OUTPUTS) || [];
  },

  outputs() {
    const outputRefs = this?.spec?.outputRefs || [];

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
        nullable:       false,
        path:           'spec.outputRefs',
        required:       true,
        translationKey: 'logging.flow.outputs',
        type:           'array'
      },
    ];
  },
};
