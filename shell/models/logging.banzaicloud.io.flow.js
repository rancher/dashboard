import { LOGGING } from '@shell/config/types';
import { set } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';
import {
  _getOutputs, _getClusterOutputs, _getProvidersDisplay, _getOutputsSortable, _getClusterOutputsSortable
} from '@shell/plugins/steve/resourceUtils/logging.banzaicloud.io.flow';

export function matchRuleIsPopulated(rule) {
  if ( !rule ) {
    return false;
  }

  if ( rule.labels && Object.keys(rule.labels).length ) {
    return true;
  }

  if ( rule.hosts?.length ) {
    return true;
  }

  if ( rule.container_names?.length ) {
    return true;
  }

  if ( rule.namespaces?.length ) {
    return true;
  }

  return false;
}

export default class LogFlow extends SteveModel {
  applyDefaults() {
    set(this, 'spec', this.spec || {});
    set(this.spec, 'match', this.spec.match || []);
    set(this.spec, 'filters', this.spec.filters || []);
    set(this.spec, 'localOutputRefs', this.spec.localOutputRefs || []);
    set(this.spec, 'globalOutputRefs', this.spec.globalOutputRefs || []);
  }

  get canCustomEdit() {
    if ( !this.spec?.match?.length ) {
      return true;
    }

    let out = true;

    for ( const match of this.spec.match ) {
      if ( matchRuleIsPopulated(match.select) && matchRuleIsPopulated(match.exclude) ) {
        out = false;
        break;
      }
    }

    return out;
  }

  get allOutputs() {
    return this.$rootGetters['cluster/all'](LOGGING.OUTPUT) || [];
  }

  get allClusterOutputs() {
    return this.$rootGetters['cluster/all'](LOGGING.CLUSTER_OUTPUT) || [];
  }

  get outputs() {
    return _getOutputs(this);
  }

  get outputsSortable() {
    return _getOutputsSortable(this);
  }

  get clusterOutputs() {
    return _getClusterOutputs(this);
  }

  get clusterOutputsSortable() {
    return _getClusterOutputsSortable(this);
  }

  get providersDisplay() {
    return _getProvidersDisplay(this);
  }

  get customValidationRules() {
    return [
      {
        path:       'spec',
        validators: ['flowOutput:verifyLocal'],
      },
    ];
  }
}
