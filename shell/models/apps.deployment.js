import { WORKLOAD_TYPES } from '@shell/config/types';
import Workload from './workload';

export default class Deployment extends Workload {
  get replicaSetId() {
    const set = this.metadata?.relationships?.find((relationship) => {
      return relationship.rel === 'owner' &&
            relationship.toType === WORKLOAD_TYPES.REPLICA_SET;
    });

    return set?.toId?.replace(`${ this.namespace }/`, '');
  }

  async rollBack(cluster, deployment, revision) {
    const body = [
      {
        op:    'replace',
        path:  '/spec/template',
        value: {
          metadata: {
            creationTimestamp: null,
            labels:            { 'workload.user.cattle.io/workloadselector': revision.spec.template.metadata.labels['workload.user.cattle.io/workloadselector'] }
          },
          spec: revision.spec.template.spec
        }
      }, {
        op:    'replace',
        path:  '/metadata/annotations',
        value: { 'deployment.kubernetes.io/revision': revision.metadata.annotations['deployment.kubernetes.io/revision'] }
      }
    ];

    await this.rollBackWorkload(cluster, deployment, 'deployments', body);
  }
}
