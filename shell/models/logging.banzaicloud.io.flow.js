import { LOGGING } from '@shell/config/types';
import { set } from '@shell/utils/object';
import uniq from 'lodash/uniq';
import SteveModel from '@shell/plugins/steve/steve-class';

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
    const localOutputRefs = this.spec?.localOutputRefs || [];

    return this.allOutputs.filter((output) => localOutputRefs.includes(output.name));
  }

  get outputsSortable() {
    const displays = this.outputs.map((o) => o.nameDisplay);

    displays.sort();

    return displays.join('');
  }

  get clusterOutputs() {
    const globalOutputRefs = this.spec?.globalOutputRefs || [];

    if (this.allClusterOutputs) {
      return this.allClusterOutputs.filter((output) => globalOutputRefs.includes(output.name));
    } else {
      // Handle the case where the user doesn't have permission
      // to see ClusterOutputs
      return [];
    }
  }

  get clusterOutputsSortable() {
    const displays = this.clusterOutputs.map((o) => o.nameDisplay);

    displays.sort();

    return displays.join('');
  }

  get providersDisplay() {
    const combinedOutputs = [...this.outputs, ...this.clusterOutputs];
    const duplicatedProviders = combinedOutputs
      .flatMap((output) => output.providersDisplay);

    return uniq(duplicatedProviders) || [];
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
