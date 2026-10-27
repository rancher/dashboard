import Deployment from '@shell/models/apps.deployment';
import { WORKLOAD_TYPES } from '@shell/config/types';

describe('class Deployment', () => {
  describe('replicaSetId', () => {
    it.each([{
      relationships: [],
      expected:      undefined,
    }, {
      relationships: [{
        rel:    'owner',
        toType: WORKLOAD_TYPES.REPLICA_SET,
        toId:   'rel-id'
      }],
      expected: 'rel-id',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 1'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 0'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 1'
      }],
      expected: 'rel-id-2',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'Message without replicas count'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'Another message without replicas count'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'ReplicaSet is available. Replicas: 0'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 0'
      }],
      expected: 'rel-id-1',
    }, {
      relationships: [{
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-1',
        message: 'Message without replicas count'
      }, {
        rel:     'owner',
        toType:  WORKLOAD_TYPES.REPLICA_SET,
        toId:    'rel-id-2',
        message: 'ReplicaSet is available. Replicas: 0'
      }],
      expected: 'rel-id-1',
    }])('replicaSetId', ({ relationships, expected }) => {
      const deploymentData = {
        id:       'any-id',
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: {
          name:      'any-name',
          namespace: 'any-namespace',
          uid:       'any-uid',
          relationships,
        },
      };

      const deployment = new Deployment(deploymentData);

      expect(deployment.replicaSetId).toStrictEqual(expected);
    });
  });

  describe('rollBack', () => {
    const cluster = { id: 'cluster-id' };
    const template = {
      metadata: {
        labels: {
          app:                 'any-app',
          'pod-template-hash': 'any-hash',
        },
        annotations: {
          'any-annotation':                    'any-value',
          'deployment.kubernetes.io/revision': '1',
        },
      },
      spec: { containers: [{ name: 'any-container', image: 'nginx:1.25' }] },
    };
    const revisionAnnotations = {
      'deployment.kubernetes.io/revision': '1',
      'kubernetes.io/change-cause':        'deploy v1',
      'field.cattle.io/description':       'description v1',
    };
    const deploymentAnnotations = {
      'deployment.kubernetes.io/revision':                '2',
      'kubectl.kubernetes.io/last-applied-configuration': '{}',
      'kubernetes.io/change-cause':                       'deploy v2',
      'field.cattle.io/description':                      'description v2',
      'added-after-revision':                             'any-value',
    };

    const createDeployment = (metadata: object) => new Deployment({
      id:       'any-namespace/any-name',
      type:     WORKLOAD_TYPES.DEPLOYMENT,
      metadata: {
        name:      'any-name',
        namespace: 'any-namespace',
        ...metadata,
      },
    });

    const getPatchBody = async(deploymentMetadata: object, revisionMetadata: object) => {
      const deployment = createDeployment(deploymentMetadata);
      const rollBackWorkload = jest.spyOn(deployment, 'rollBackWorkload').mockResolvedValue(undefined);

      await deployment.rollBack(cluster, deployment, { metadata: revisionMetadata, spec: { template } });

      return rollBackWorkload.mock.calls[0][3];
    };

    it('should call rollBackWorkload with the deployments type', async() => {
      const deployment = createDeployment({ annotations: deploymentAnnotations });
      const rollBackWorkload = jest.spyOn(deployment, 'rollBackWorkload').mockResolvedValue(undefined);

      await deployment.rollBack(cluster, deployment, { metadata: { annotations: revisionAnnotations }, spec: { template } });

      expect(rollBackWorkload).toHaveBeenCalledWith(cluster, deployment, 'deployments', expect.any(Array));
    });

    it('should replace the pod template with the revision template', async() => {
      const body = await getPatchBody({ annotations: deploymentAnnotations }, { annotations: revisionAnnotations });

      expect(body[0]).toStrictEqual({
        op:    'replace',
        path:  '/spec/template',
        value: {
          metadata: {
            creationTimestamp: null,
            labels:            { app: 'any-app' },
            annotations:       { 'any-annotation': 'any-value' },
          },
          spec: template.spec,
        },
      });
    });

    it('should keep ignored annotations from the deployment and restore the rest from the revision', async() => {
      const body = await getPatchBody({ annotations: deploymentAnnotations }, { annotations: revisionAnnotations });

      expect(body[1]).toStrictEqual({
        op:    'add',
        path:  '/metadata/annotations',
        value: {
          'deployment.kubernetes.io/revision':                '2',
          'kubectl.kubernetes.io/last-applied-configuration': '{}',
          'kubernetes.io/change-cause':                       'deploy v1',
          'field.cattle.io/description':                      'description v1',
        },
      });
    });

    it('should not take ignored annotations from the revision', async() => {
      const body = await getPatchBody({ annotations: {} }, { annotations: { ...revisionAnnotations, 'deployment.kubernetes.io/revision-history': '1' } });

      expect(body[1].value).toStrictEqual({
        'kubernetes.io/change-cause':  'deploy v1',
        'field.cattle.io/description': 'description v1',
      });
    });

    it.each([
      ['empty annotations, as set on the detail page', { annotations: {} }],
      ['no annotations', {}],
    ])('should add the revision annotations when the deployment has %s', async(_, deploymentMetadata) => {
      const body = await getPatchBody(deploymentMetadata, { annotations: revisionAnnotations });

      expect(body[1]).toStrictEqual({
        op:    'add',
        path:  '/metadata/annotations',
        value: {
          'kubernetes.io/change-cause':  'deploy v1',
          'field.cattle.io/description': 'description v1',
        },
      });
    });

    it('should only keep ignored deployment annotations when the revision has no annotations', async() => {
      const body = await getPatchBody({ annotations: deploymentAnnotations }, {});

      expect(body[1].value).toStrictEqual({
        'deployment.kubernetes.io/revision':                '2',
        'kubectl.kubernetes.io/last-applied-configuration': '{}',
      });
    });
  });
});
