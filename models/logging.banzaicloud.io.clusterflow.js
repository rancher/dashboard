import { LOGGING } from '@/config/types';
import uniq from 'lodash/uniq';

export default {
  allOutputs() {
    return this.$rootGetters['cluster/all'](LOGGING.CLUSTER_OUTPUTS) || [];
  },

  outputs() {
    const outputRefs = this?.spec?.globalOutputRefs || this?.spec?.outputRefs || [];

    return this.allOutputs.filter(output => outputRefs.includes(output.name));
  },

  setOutputRefs() {
    return (outputRefs) => {
      this.spec = this.spec || {};
      this.spec.globalOutputRefs = outputRefs;

      // outputRefs is deprecated so we're clearing it.
      this.spec.outputRefs = undefined;
    };
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
        path:           'spec.globalOutputRefs',
        required:       true,
        translationKey: 'logging.flow.outputs',
        type:           'array'
      },
    ];
  },
};
