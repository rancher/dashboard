
import uniq from 'lodash/uniq';
import { _getAllOutputs, _getOutputs } from '@shell/plugins/steve/resourceUtils/logging.banzaicloud.io.clusterflow';
import Flow from './logging.banzaicloud.io.flow';

export default class LogClusterFlow extends Flow {
  get allOutputs() {
    return _getAllOutputs(this, { all: this.$rootGetters['cluster/all'] });
  }

  get outputs() {
    return _getOutputs(this);
  }

  get outputProviders() {
    const duplicatedProviders = this.outputs
      .flatMap(output => output.providers);

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
