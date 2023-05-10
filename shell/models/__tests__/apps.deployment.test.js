import Deployment from '@shell/models/apps.deployment.js';

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
