import Deployment from '@shell/models/apps.deployment.js';
import { WORKLOAD_TYPES, POD } from '@shell/config/types';

const IGNORED_ANNOTATIONS = [
  'kubectl.kubernetes.io/last-applied-configuration',
  'deployment.kubernetes.io/revision',
  'deployment.kubernetes.io/revision-history',
  'deployment.kubernetes.io/desired-replicas',
  'deployment.kubernetes.io/max-replicas',
  'deprecated.deployment.rollback.to',
];

const IGNORED_LABELS = [
  'pod-template-hash'
];

describe('model: apps.deployment rollback', () => {
  it('should ignore some labels and annotations', async() => {
    const rollBackWorkload = jest.fn();
    const app = new Deployment({ rollBackWorkload });

    const annotations = {};
    const labels = {};

    IGNORED_ANNOTATIONS.forEach((key) => {
      annotations[key] = key;
    });
    IGNORED_LABELS.forEach((key) => {
      labels[key] = key;
    });

    const revision = {
      metadata: { annotations: { 'deployment.kubernetes.io/revision': 1 } },
      spec:     {
        template: {
          metadata: {
            annotations,
            labels
          }
        }
      }
    };

    await app.rollBack('cluster', 'deployment', revision);

    expect(rollBackWorkload.mock.calls[0][3][0].value.metadata.annotations).toStrictEqual({});
    expect(rollBackWorkload.mock.calls[0][3][0].value.metadata.labels).toStrictEqual({});
  });

  it('should have correct labels and annotations', async() => {
    const rollBackWorkload = jest.fn();
    const app = new Deployment({ rollBackWorkload });

    const annotations = {};
    const labels = {};

    IGNORED_ANNOTATIONS.forEach((key) => {
      annotations[key] = key;
    });
    IGNORED_LABELS.forEach((key) => {
      labels[key] = key;
    });

    const revision = {
      metadata: { annotations: { 'deployment.kubernetes.io/revision': 1 } },
      spec:     {
        template: {
          metadata: {
            annotations: { ...annotations, others: 'others' },
            labels:      { ...labels, others: 'others' },
          }
        }
      }
    };

    await app.rollBack('cluster', 'deployment', revision);

    expect(rollBackWorkload.mock.calls[0][3][0].value.metadata.annotations).toStrictEqual({ others: 'others' });
    expect(rollBackWorkload.mock.calls[0][3][0].value.metadata.labels).toStrictEqual({ others: 'others' });
  });
});

describe('model: apps.deployment replicaSetId', () => {
  const namespace = 'ns';
  const replicaSetId = 'replicaSetId';

  it('should get replicaSetId from relationships', () => {
    const app = new Deployment({
      metadata: {
        namespace,
        relationships: [{
          rel:    'owner',
          toType: WORKLOAD_TYPES.REPLICA_SET,
          toId:   `${ namespace }/${ replicaSetId }`
        }]
      }
    });

    expect(app.replicaSetId).toBe('replicaSetId');
  });

  it('should get replicaSetId from pods', () => {
    const app = new Deployment({
      metadata: {
        namespace,
        relationships: [{
          toType:      POD,
          toNamespace: 'cattle-gatekeeper-system',
          rel:         'creates',
          selector:    'app=rancher-gatekeeper,chart=rancher-gatekeeper,control-plane=controller-manager,gatekeeper.sh/operation=webhook,gatekeeper.sh/system=yes,heritage=Helm,release=rancher-gatekeeper'
        }],
      }
    }, {
      getters: {
        podsByNamespace: () => [{
          ownersByType: { ReplicaSet: [{ name: replicaSetId }] },
          metadata:     {
            labels: {
              app:                            'rancher-gatekeeper',
              'app.kubernetes.io/managed-by': 'Helm',
              chart:                          'rancher-gatekeeper',
              'control-plane':                'controller-manager',
              'gatekeeper.sh/operation':      'webhook',
              'gatekeeper.sh/system':         'yes',
              heritage:                       'Helm',
              release:                        'rancher-gatekeeper'
            },
            ownerReferences: [{
              apiVersion:         'apps/v1',
              blockOwnerDeletion: true,
              controller:         true,
              kind:               'ReplicaSet',
              name:               'gatekeeper-controller-manager-6dd67b864f',
              uid:                '969aef3d-6cb6-4499-9d77-7537ef27f0cb'
            }]
          }
        }]
      }
    });

    expect(app.replicaSetId).toBe('replicaSetId');
  });

  it('should get replicaSetId from condition', () => {
    const app = new Deployment({
      status: {
        conditions: [{
          message: `ReplicaSet "${ replicaSetId }" has successfully progressed.`,
          type:    'Progressing'
        }],
      },
      metadata: {
        namespace,
        relationships: [{
          toType:      POD,
          toNamespace: 'cattle-gatekeeper-system',
          rel:         'creates',
          selector:    'app=rancher-gatekeeper,chart=rancher-gatekeeper,control-plane=controller-manager,gatekeeper.sh/operation=webhook,gatekeeper.sh/system=yes,heritage=Helm,release=rancher-gatekeeper'
        }],
      }
    }, { getters: { podsByNamespace: () => [] } });

    expect(app.replicaSetId).toBe('replicaSetId');
  });

  it('should get replicaSetId from relationships. There are multiple values', () => {
    const app = new Deployment({
      metadata: {
        namespace,
        relationships: [{
          rel:    'owner',
          toType: WORKLOAD_TYPES.REPLICA_SET,
          toId:   `${ namespace }/${ replicaSetId }2`
        }, {
          rel:    'owner',
          toType: WORKLOAD_TYPES.REPLICA_SET,
          toId:   `${ namespace }/${ replicaSetId }`
        }]
      }
    });

    expect(app.replicaSetId).toBe('replicaSetId2');
  });
});
