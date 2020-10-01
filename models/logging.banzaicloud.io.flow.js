import { LOGGING } from '@/config/types';
import { set } from '@/utils/object';
import uniq from 'lodash/uniq';

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

  return false;
}

export default {
  applyDefaults() {
    return () => {
      set(this, 'spec', this.spec || {});
      set(this.spec, 'match', this.spec.match || []);
      set(this.spec, 'filters', this.spec.filters || []);
      set(this.spec, 'localOutputRefs', this.spec.localOutputRefs || []);
      set(this.spec, 'globalOutputRefs', this.spec.globalOutputRefs || []);
    };
  },

  canCustomEdit() {
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
  },

  allOutputs() {
    return this.$rootGetters['cluster/all'](LOGGING.OUTPUT) || [];
  },

  allClusterOutputs() {
    return this.$rootGetters['cluster/all'](LOGGING.CLUSTER_OUTPUT) || [];
  },

  outputs() {
    const localOutputRefs = this.spec?.localOutputRefs || [];

    return this.allOutputs.filter(output => localOutputRefs.includes(output.name));
  },

  clusterOutputs() {
    const globalOutputRefs = this.spec?.globalOutputRefs || [];

    return this.allClusterOutputs.filter(output => globalOutputRefs.includes(output.name));
  },

  outputProviders() {
    const combinedOutputs = [...this.outputs, ...this.clusterOutputs];
    const duplicatedProviders = combinedOutputs
      .flatMap(output => output.providers);

    return uniq(duplicatedProviders) || [];
  },

  customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'spec.localOutputRefs',
        required:       true,
        translationKey: 'logging.flow.outputs.label',
        type:           'array'
      },
    ];
  },
};
