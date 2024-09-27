import Workload from './workload';
import { WORKLOAD_TYPES, POD, WORKLOAD_TYPE_TO_KIND_MAPPING } from '@shell/config/types';

export default class StatefulSet extends Workload {
  async rollBack(cluster, statefulSet, revision) {
    const body = [
      {
        op:    'replace',
        path:  '/spec/template',
        value: {
          metadata: revision.data.spec.template.metadata,
          spec:     revision.data.spec.template.spec
        }
      }, {
        op:    'replace',
        path:  '/metadata/generation',
        value: revision.revision,
      }
    ];

    await this.rollBackWorkload(cluster, statefulSet, 'statefulsets', body);
  }

  // we need to provide a new pods getter for statefulsets because the relationship
  // done on the parent model "workload" is not correct
  get pods() {
    const relationships = this.metadata?.relationships || [];
    const podRelationship = relationships.filter((relationship) => relationship.toType === POD)[0];

    if (podRelationship) {
      const pods = this.$getters['podsByNamespace'](this.metadata.namespace);

      return pods.filter((pod) => {
        // a bit of a duplication of podRelationship, but always safe to check...
        if (pod.metadata?.ownerReferences?.length) {
          const ownerReferencesStatefulSet = pod.metadata?.ownerReferences?.find((own) => own.kind === WORKLOAD_TYPE_TO_KIND_MAPPING[WORKLOAD_TYPES.STATEFUL_SET]);

          if (ownerReferencesStatefulSet) {
            return `${ pod.metadata.namespace }/${ ownerReferencesStatefulSet.name }` === this.id;
          }
        }

        return false;
      });
    }

    return [];
  }
}
