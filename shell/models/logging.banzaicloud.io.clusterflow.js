import { LOGGING } from '@shell/config/types';
import uniq from 'lodash/uniq';
import Flow from './logging.banzaicloud.io.flow';

export default class LogClusterFlow extends Flow {
  get allOutputs() {
    return this.$rootGetters['cluster/all'](LOGGING.CLUSTER_OUTPUT) || [];
  }

  get outputs() {
    if (!this.allOutputs) {
      // Handle the case where the user doesn't have permission
      // to see Outputs
      return [];
    }
    const outputRefs = this?.spec?.globalOutputRefs || this?.spec?.outputRefs || [];

    return this.allOutputs.filter((output) => outputRefs.includes(output.name));
  }

  get outputProviders() {
    const duplicatedProviders = this.outputs
      .flatMap((output) => output.providers);

    return uniq(duplicatedProviders) || [];
  }

  get customValidationRules() {
    return [
      {
        path:       'spec',
        validators: ['flowOutput'],
      },
    ];
  }
}
