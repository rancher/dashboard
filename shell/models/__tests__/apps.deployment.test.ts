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
    const revision = {
      metadata: { annotations: { 'deployment.kubernetes.io/revision': '1' } },
      spec:     {
        template: {
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
          spec: { containers: [{ name: 'any-container', image: 'any-image' }] },
        },
      },
    };

    const getPatchBody = async(metadata: object = {
      annotations: {
        'deployment.kubernetes.io/revision': '2',
        'field.cattle.io/description':       'any-description',
        'custom-annotation':                 'custom-value',
      }
    }) => {
      const deployment = new Deployment({
        id:       'any-namespace/any-name',
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: {
          name:      'any-name',
          namespace: 'any-namespace',
          ...metadata,
        },
      });
      const rollBackWorkload = jest.spyOn(deployment, 'rollBackWorkload').mockResolvedValue(undefined);

      await deployment.rollBack(cluster, deployment, revision);

      return rollBackWorkload.mock.calls[0][3];
    };

    it('should call rollBackWorkload with the deployments type', async() => {
      const deployment = new Deployment({
        id:       'any-namespace/any-name',
        type:     WORKLOAD_TYPES.DEPLOYMENT,
        metadata: { name: 'any-name', namespace: 'any-namespace' },
      });
      const rollBackWorkload = jest.spyOn(deployment, 'rollBackWorkload').mockResolvedValue(undefined);

      await deployment.rollBack(cluster, deployment, revision);

      expect(rollBackWorkload).toHaveBeenCalledWith(cluster, deployment, 'deployments', expect.any(Array));
    });

    it('should only update the revision annotation and keep other deployment annotations', async() => {
      const body = await getPatchBody();

      expect(body[1]).toStrictEqual({
        op:    'add',
        path:  '/metadata/annotations/deployment.kubernetes.io~1revision',
        value: '1',
      });
    });

    it('should not replace the whole deployment annotations object', async() => {
      const body = await getPatchBody();

      expect(body.find((op: any) => op.path === '/metadata/annotations')).toBeUndefined();
    });

    it('should add the annotations object when the deployment has no annotations', async() => {
      const body = await getPatchBody({});

      expect(body[1]).toStrictEqual({
        op:    'add',
        path:  '/metadata/annotations',
        value: { 'deployment.kubernetes.io/revision': '1' },
      });
    });

    it('should replace the pod template with the revision spec', async() => {
      const body = await getPatchBody();

      expect(body[0]).toStrictEqual({
        op:    'replace',
        path:  '/spec/template',
        value: {
          metadata: {
            creationTimestamp: null,
            labels:            { app: 'any-app' },
            annotations:       { 'any-annotation': 'any-value' },
          },
          spec: revision.spec.template.spec,
        },
      });
    });
  });
});
