import { set } from '@/utils/object';

export const ENFORCEMENT_ACTION_VALUES = {
  DENY:   'deny',
  DRYRUN: 'dryrun'
};

export default {
  applyDefaults() {
    const spec = this.spec || {};

    spec.match = spec.match || {};
    spec.match.labelSelector = spec.match.labelSelector || {};
    spec.match.labelSelector.matchExpressions = spec.match.labelSelector.matchExpressions || [];

    spec.match = spec.match || {};
    spec.match.namespaceSelector = spec.match.namespaceSelector || {};
    spec.match.namespaceSelector.matchExpressions = spec.match.namespaceSelector.matchExpressions || [];

    spec.enforcementAction = spec.enforcementAction || ENFORCEMENT_ACTION_VALUES.DENY;

    set(this, 'spec', spec);
  },
  doneOverride() {
    return () => {
      this.currentRouter().replace({ name: 'c-cluster-gatekeeper-constraints' });
    };
  },

  detailLocation() {
    return {
      name:   'c-cluster-gatekeeper-constraints-resource-id',
      params: {
        resource: this.type,
        id:       this.id
      }
    };
  }
};
