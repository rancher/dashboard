import ReplicaSet from '@shell/models/apps.replicaset';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';

const publicEndpointsAnnotation = JSON.stringify([
  {
    addresses: ['172.18.0.3'], port: 32767, protocol: 'TCP', serviceName: 'default:frontend', allNodes: true
  },
  {
    addresses: ['172.18.0.3'], port: 32000, protocol: 'TCP', serviceName: 'default:frontend', allNodes: true
  },
]);

const baseGlance = [
  { name: 'state' },
  { name: 'type' },
  { name: 'namespace' },
  { name: 'age' },
];

const createReplicaSet = (data: any = {}, { endpoints = undefined as string | undefined, glance = baseGlance } = {}): any => {
  const replicaSet = new ReplicaSet({
    type:     WORKLOAD_TYPES.REPLICA_SET,
    metadata: {
      name: 'frontend-567d5b464c', namespace: 'default', annotations: endpoints === undefined ? undefined : { [CATTLE_PUBLIC_ENDPOINTS]: endpoints }
    },
    ...data,
  }, {
    getters:     { schemaFor: jest.fn(() => ({ id: WORKLOAD_TYPES.REPLICA_SET })) },
    dispatch:    jest.fn(),
    rootGetters: { 'i18n/t': (key: string) => key },
  });

  Object.defineProperty(replicaSet, '_glance', { get: () => glance });

  return replicaSet;
};

const glanceRow = (replicaSet: any, name: string) => replicaSet.glance.find((item: any) => item.name === name);

describe('class ReplicaSet', () => {
  describe('glance', () => {
    it('should add the ready, pod restarts and endpoints rows before the age', () => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 }, status: { readyReplicas: 3 } });

      expect(replicaSet.glance.map((item: any) => item.name)).toStrictEqual(['state', 'type', 'namespace', 'ready', 'podRestarts', 'endpoints', 'age']);
    });

    it('should add the rows at the end when there is no age row', () => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 }, status: { readyReplicas: 3 } }, { glance: [{ name: 'state' }] });

      expect(replicaSet.glance.map((item: any) => item.name)).toStrictEqual(['state', 'ready', 'podRestarts', 'endpoints']);
    });

    it.each([
      ['all replicas ready', 3, 3, 3, undefined],
      ['some replicas not ready', 3, 1, 1, undefined],
      ['no replica ready', 3, undefined, 0, undefined],
      ['scaled to zero', 0, undefined, 0, 'none'],
    ])('should show the ready replicas when %s', (_, replicas, readyReplicas, ready, status) => {
      const replicaSet = createReplicaSet({ spec: { replicas }, status: { readyReplicas } });

      expect(glanceRow(replicaSet, 'ready')).toStrictEqual({
        name:          'ready',
        label:         'component.resource.detail.glance.ready',
        formatter:     'ReadyIndicator',
        formatterOpts: {
          ready, total: replicas, status
        },
        content: `${ ready }/${ replicas }`
      });
    });

    it('should count ready replicas, not replicas that are merely created', () => {
      // A ReplicaSet reports no unavailableReplicas, so replicas minus unavailable would claim every pod is ready
      const replicaSet = createReplicaSet({ spec: { replicas: 3 }, status: { replicas: 3, readyReplicas: 0 } });
      const row = glanceRow(replicaSet, 'ready');

      expect(row.content).toStrictEqual('0/3');
      expect(row.formatterOpts).toStrictEqual({
        ready: 0, total: 3, status: undefined
      });
    });

    it('should show no replicas to be ready when there are no spec replicas or status', () => {
      const replicaSet = createReplicaSet();
      const row = glanceRow(replicaSet, 'ready');

      expect(row.content).toStrictEqual('0/0');
      expect(row.formatterOpts.status).toStrictEqual('none');
    });

    it('should show the pod restarts with a formatter that fetches the pods of this ReplicaSet', () => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 } });

      expect(glanceRow(replicaSet, 'podRestarts')).toStrictEqual({
        name:          'podRestarts',
        label:         'component.resource.detail.glance.podRestarts',
        formatter:     'WorkloadPodRestarts',
        formatterOpts: { row: replicaSet },
      });
    });

    it('should show the endpoints annotation with the formatter of the ReplicaSets list Endpoints column', () => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 } }, { endpoints: publicEndpointsAnnotation });

      expect(glanceRow(replicaSet, 'endpoints')).toStrictEqual({
        name:          'endpoints',
        label:         'component.resource.detail.glance.endpoints',
        formatter:     'Endpoints',
        formatterOpts: { row: replicaSet, col: {} },
        content:       publicEndpointsAnnotation
      });
    });

    it('should show a dash rather than drop the endpoints row when there are no endpoints', () => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 } });
      const row = glanceRow(replicaSet, 'endpoints');

      expect(row.formatter).toBeUndefined();
      expect(row.content).toStrictEqual('—');
    });

    it('should show a dash when the endpoints annotation is malformed', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const replicaSet = createReplicaSet({ spec: { replicas: 3 } }, { endpoints: 'not json' });
      const row = glanceRow(replicaSet, 'endpoints');

      expect(row.formatter).toBeUndefined();
      expect(row.content).toStrictEqual('—');

      warn.mockRestore();
    });
  });
});
