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

    it('should keep the deployment annotations and take the change cause from the revision', async() => {
      const body = await getPatchBody({ annotations: deploymentAnnotations }, { annotations: revisionAnnotations });

      expect(body[1]).toStrictEqual({
        op:    'add',
        path:  '/metadata/annotations',
        value: {
          'deployment.kubernetes.io/revision':                '2',
          'kubectl.kubernetes.io/last-applied-configuration': '{}',
          'kubernetes.io/change-cause':                       'deploy v1',
          'field.cattle.io/description':                      'description v2',
          'added-after-revision':                             'any-value',
        },
      });
    });

    it('should remove the change cause when the revision has none', async() => {
      const body = await getPatchBody({ annotations: deploymentAnnotations }, { annotations: { 'deployment.kubernetes.io/revision': '1' } });

      expect(body[1].value).toStrictEqual({
        'deployment.kubernetes.io/revision':                '2',
        'kubectl.kubernetes.io/last-applied-configuration': '{}',
        'field.cattle.io/description':                      'description v2',
        'added-after-revision':                             'any-value',
      });
    });

    it('should not change the deployment annotations on the model', async() => {
      const annotations = { ...deploymentAnnotations };

      await getPatchBody({ annotations }, {});

      expect(annotations).toStrictEqual(deploymentAnnotations);
    });

    it.each([
      ['empty annotations, as set on the detail page', { annotations: {} }, { annotations: revisionAnnotations }, { 'kubernetes.io/change-cause': 'deploy v1' }],
      ['no annotations', {}, { annotations: revisionAnnotations }, { 'kubernetes.io/change-cause': 'deploy v1' }],
      ['empty annotations and the revision has no change cause', { annotations: {} }, {}, {}],
      ['no annotations and the revision has no change cause', {}, {}, {}],
    ])('should add the annotations object when the deployment has %s', async(_, deploymentMetadata, revisionMetadata, expected) => {
      const body = await getPatchBody(deploymentMetadata, revisionMetadata);

      expect(body[1]).toStrictEqual({
        op:    'add',
        path:  '/metadata/annotations',
        value: expected,
      });
    });
  });
});
