import { WORKLOAD_TYPES } from '@shell/config/types';
import Workload from './workload';

const IGNORED_ANNOTATIONS = [
  'kubectl.kubernetes.io/last-applied-configuration',
  'deployment.kubernetes.io/revision',
  'deployment.kubernetes.io/revision-history',
  'deployment.kubernetes.io/desired-replicas',
  'deployment.kubernetes.io/max-replicas',
  'deprecated.deployment.rollback.to',
];

const replicasRegEx = /Replicas: (\d+)/;

export default class Deployment extends Workload {
  get replicaSetId() {
    const relationships = this.metadata?.relationships || [];

    // Find all relevant ReplicaSet relationships
    const replicaSetRelationships = relationships.filter((relationship) => relationship.rel === 'owner' && relationship.toType === WORKLOAD_TYPES.REPLICA_SET
    );

    // Filter the ReplicaSets based on replicas > 0
    const activeReplicaSet = replicaSetRelationships.find((relationship) => {
      const replicasMatch = relationship.message?.match(replicasRegEx);
      const replicas = replicasMatch ? parseInt(replicasMatch[1], 10) : 0;

      return replicas > 0;
    });

    // If no active ReplicaSet is found, fall back to the first one from the list
    const selectedReplicaSet = activeReplicaSet || replicaSetRelationships[0];

    return selectedReplicaSet?.toId?.replace(`${ this.namespace }/`, '');
  }

  async rollBack(cluster, deployment, revision) {
    // Same as kubectl rollout undo: keep the ignored annotations from the deployment and restore the rest from the revision
    const deploymentAnnotations = deployment.metadata?.annotations || {};
    const revisionAnnotations = revision.metadata?.annotations || {};
    const annotations = {};

    IGNORED_ANNOTATIONS.forEach((key) => {
      if (key in deploymentAnnotations) {
        annotations[key] = deploymentAnnotations[key];
      }
    });

    Object.keys(revisionAnnotations).forEach((key) => {
      if (!IGNORED_ANNOTATIONS.includes(key)) {
        annotations[key] = revisionAnnotations[key];
      }
    });

    const body = [
      {
        op:    'replace',
        path:  '/spec/template',
        value: {
          metadata: {
            creationTimestamp: null,
            labels:            Object.keys(revision.spec.template.metadata?.labels || {}).reduce((prev, key) => {
              if (key !== 'pod-template-hash') {
                prev[key] = revision.spec.template.metadata.labels[key];
              }

              return prev;
            }, {}),
            annotations: Object.keys(revision.spec.template.metadata?.annotations || {}).reduce((prev, key) => {
              if (!IGNORED_ANNOTATIONS.includes(key)) {
                prev[key] = revision.spec.template.metadata.annotations[key];
              }

              return prev;
            }, {}),
          },
          spec: revision.spec.template.spec
        }
      }, {
        // add replaces the annotations if they exist and creates them if not
        op:    'add',
        path:  '/metadata/annotations',
        value: annotations
      }
    ];

    await this.rollBackWorkload(cluster, deployment, 'deployments', body);
  }
}
