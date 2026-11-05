import ReplicaSet from '@shell/models/apps.replicaset';
import { GATEWAY_API, POD, SERVICE, WORKLOAD_TYPES } from '@shell/config/types';
import { convertSelectorObj } from '@shell/utils/selector';
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

const createReplicaSet = (data: any = {}, {
  endpoints = undefined as string | undefined, glance = baseGlance, rootGetters = {} as any, getters = {} as any
} = {}): any => {
  const replicaSet = new ReplicaSet({
    type:     WORKLOAD_TYPES.REPLICA_SET,
    metadata: {
      name: 'frontend-567d5b464c', namespace: 'default', annotations: endpoints === undefined ? undefined : { [CATTLE_PUBLIC_ENDPOINTS]: endpoints }
    },
    ...data,
  }, {
    getters:     { schemaFor: jest.fn(() => ({ id: WORKLOAD_TYPES.REPLICA_SET })), ...getters },
    dispatch:    jest.fn(),
    rootGetters: {
      'i18n/t':                 (key: string) => key,
      'cluster/typeRegistered': () => false,
      'cluster/schemaFor':      () => undefined,
      ...rootGetters,
    },
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

    it('should show the endpoints annotation with a formatter that renders it like the ReplicaSets list Endpoints column', () => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 } }, { endpoints: publicEndpointsAnnotation });

      expect(glanceRow(replicaSet, 'endpoints')).toStrictEqual({
        name:          'endpoints',
        label:         'component.resource.detail.glance.endpoints',
        formatter:     'WorkloadGlanceEndpoints',
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

  describe('ready', () => {
    it.each([
      ['all replicas ready', { replicas: 3 }, { replicas: 3, readyReplicas: 3 }, '3/3'],
      ['no replica ready, although all of them are created', { replicas: 3 }, { replicas: 3 }, '0/3'],
      ['some replicas ready', { replicas: 3 }, { replicas: 3, readyReplicas: 1 }, '1/3'],
      ['more replicas ready than desired, while scaling down', { replicas: 1 }, { replicas: 3, readyReplicas: 3 }, '3/1'],
      ['scaled to zero', { replicas: 0 }, { replicas: 0 }, '0/0'],
      ['no status yet', { replicas: 3 }, undefined, '0/3'],
    ])('should show the ready replicas out of the desired ones when %s, like kubectl', (_, spec, status, expected) => {
      const replicaSet = createReplicaSet({ spec, status });

      expect(replicaSet.ready).toStrictEqual(expected);
    });

    it('should show the ready replicas in the Ready row of the masthead', () => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 }, status: { replicas: 3, readyReplicas: 0 } });
      const readyRow = replicaSet.details.find((item: any) => item.label === 'Ready');

      expect(readyRow.content).toStrictEqual('0/3');
    });
  });

  describe('glanceGatewayEndpoints', () => {
    const gatewayEndpoints = [{ link: 'http://shop.example.com/shop', linkDisplay: 'http://shop.example.com/shop' }];

    const createWithGatewayEndpoints = (registered: string[], options: any = {}) => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 } }, { ...options, rootGetters: { 'cluster/typeRegistered': (type: string) => registered.includes(type) } });
      const getGatewayEndpoints = jest.fn(() => gatewayEndpoints);

      Object.defineProperty(replicaSet, 'gatewayEndpoints', { get: getGatewayEndpoints });

      return { replicaSet, getGatewayEndpoints };
    };

    it('should be the gateway endpoints once the services, HTTPRoutes and gateways are in the store', () => {
      const { replicaSet } = createWithGatewayEndpoints([SERVICE, GATEWAY_API.HTTP_ROUTE, GATEWAY_API.GATEWAY]);

      expect(replicaSet.glanceGatewayEndpoints).toStrictEqual(gatewayEndpoints);
    });

    it.each([
      ['services', [GATEWAY_API.HTTP_ROUTE, GATEWAY_API.GATEWAY]],
      ['HTTPRoutes', [SERVICE, GATEWAY_API.GATEWAY]],
      ['gateways', [SERVICE, GATEWAY_API.HTTP_ROUTE]],
      ['services, HTTPRoutes or gateways', []],
    ])('should be empty, without working them out, when the store has no %s yet', (_, registered) => {
      const { replicaSet, getGatewayEndpoints } = createWithGatewayEndpoints(registered);

      expect(replicaSet.glanceGatewayEndpoints).toStrictEqual([]);
      expect(getGatewayEndpoints).toHaveBeenCalledTimes(0);
    });
  });

  describe('endpoints row with the Gateway API', () => {
    const allTypes = [SERVICE, GATEWAY_API.HTTP_ROUTE, GATEWAY_API.GATEWAY];

    const createWithSchemas = (types: string[], options: any = {}) => createReplicaSet({ spec: { replicas: 3 } }, { ...options, rootGetters: { 'cluster/schemaFor': (type: string) => (types.includes(type) ? { id: type } : undefined) } });

    it('should use the formatter that fetches the gateway endpoints when there are no public endpoints', () => {
      const replicaSet = createWithSchemas(allTypes);

      expect(glanceRow(replicaSet, 'endpoints')).toStrictEqual({
        name:          'endpoints',
        label:         'component.resource.detail.glance.endpoints',
        formatter:     'WorkloadGlanceEndpoints',
        formatterOpts: { row: replicaSet, col: {} },
        content:       '—'
      });
    });

    it('should pass on the public endpoints annotation as well', () => {
      const replicaSet = createWithSchemas(allTypes, { endpoints: publicEndpointsAnnotation });
      const row = glanceRow(replicaSet, 'endpoints');

      expect(row.formatter).toStrictEqual('WorkloadGlanceEndpoints');
      expect(row.content).toStrictEqual(publicEndpointsAnnotation);
    });

    it.each([
      ['services', [GATEWAY_API.HTTP_ROUTE, GATEWAY_API.GATEWAY]],
      ['HTTPRoutes, e.g. on a cluster without the Gateway API', [SERVICE, GATEWAY_API.GATEWAY]],
      ['gateways', [SERVICE, GATEWAY_API.HTTP_ROUTE]],
    ])('should show a dash without a formatter when the user can not see %s and there are no public endpoints', (_, types) => {
      const replicaSet = createWithSchemas(types);
      const row = glanceRow(replicaSet, 'endpoints');

      expect(row.formatter).toBeUndefined();
      expect(row.content).toStrictEqual('—');
    });
  });

  describe('fetchGatewayEndpointResources', () => {
    const allTypes = [SERVICE, GATEWAY_API.HTTP_ROUTE, GATEWAY_API.GATEWAY];

    const createWithSchemas = (types: string[]) => createReplicaSet({ spec: { replicas: 3 } }, { rootGetters: { 'cluster/schemaFor': (type: string) => (types.includes(type) ? { id: type } : undefined) } });

    it('should fetch the services in the namespace, the HTTPRoutes and the gateways, like the workload detail page', async() => {
      const replicaSet = createWithSchemas(allTypes);

      await replicaSet.fetchGatewayEndpointResources();

      expect(replicaSet.$dispatch).toHaveBeenCalledTimes(3);
      expect(replicaSet.$dispatch).toHaveBeenCalledWith('cluster/findAll', { type: SERVICE, opt: { namespaced: 'default' } }, { root: true });
      expect(replicaSet.$dispatch).toHaveBeenCalledWith('cluster/findAll', { type: GATEWAY_API.HTTP_ROUTE }, { root: true });
      expect(replicaSet.$dispatch).toHaveBeenCalledWith('cluster/findAll', { type: GATEWAY_API.GATEWAY }, { root: true });
    });

    it.each([
      ['services', [GATEWAY_API.HTTP_ROUTE, GATEWAY_API.GATEWAY]],
      ['HTTPRoutes, e.g. on a cluster without the Gateway API', [SERVICE, GATEWAY_API.GATEWAY]],
      ['gateways', [SERVICE, GATEWAY_API.HTTP_ROUTE]],
    ])('should fetch nothing when the user can not see %s, as there can be no gateway endpoints', async(_, types) => {
      const replicaSet = createWithSchemas(types);

      await replicaSet.fetchGatewayEndpointResources();

      expect(replicaSet.$dispatch).toHaveBeenCalledTimes(0);
    });

    it('should fail when they can not be fetched, so the card can show that there are none', async() => {
      const replicaSet = createWithSchemas(allTypes);

      replicaSet.$dispatch.mockRejectedValue(new Error('forbidden'));

      await expect(replicaSet.fetchGatewayEndpointResources()).rejects.toThrow('forbidden');
    });
  });

  describe('podsInStore', () => {
    const selector = { matchLabels: { app: 'frontend', 'pod-template-hash': '567d5b464c' } };
    const pod = (name: string) => ({ metadata: { name, namespace: 'default' } });

    const createWithStore = (pods: any[], { status = { replicas: 3 } as any, registered = true, spec = { selector } as any } = {}) => createReplicaSet({ spec, status }, {
      getters: {
        typeRegistered: jest.fn((type: string) => registered && type === POD),
        matching:       jest.fn(() => pods),
      }
    });

    it('should look up the pods matching the selector in the namespace of the ReplicaSet', () => {
      const replicaSet = createWithStore([]);

      replicaSet.podsInStore; // eslint-disable-line no-unused-expressions

      expect(replicaSet.$getters.matching).toHaveBeenCalledWith(POD, convertSelectorObj(selector), 'default');
    });

    it('should return the pods when the store has all of them, e.g. on the page of the Deployment', () => {
      const pods = [pod('a'), pod('b'), pod('c')];

      expect(createWithStore(pods).podsInStore).toStrictEqual(pods);
    });

    it('should return the pods when the store has more than the ReplicaSet counts, e.g. one still terminating', () => {
      const pods = [pod('a'), pod('b'), pod('c'), pod('d')];

      expect(createWithStore(pods).podsInStore).toStrictEqual(pods);
    });

    it('should return nothing when the store only has some of them, e.g. on the page of one of its pods', () => {
      expect(createWithStore([pod('a')]).podsInStore).toBeUndefined();
    });

    it.each([
      ['no replicas', { replicas: 0 }],
      ['no replica count', {}],
    ])('should return no pods for a ReplicaSet with %s', (_, status) => {
      expect(createWithStore([], { status }).podsInStore).toStrictEqual([]);
    });

    it('should return nothing without asking the store when it has never loaded pods', () => {
      const replicaSet = createWithStore([pod('a'), pod('b'), pod('c')], { registered: false });

      expect(replicaSet.podsInStore).toBeUndefined();
      expect(replicaSet.$getters.matching).toHaveBeenCalledTimes(0);
    });

    it('should return nothing when the ReplicaSet has no selector, rather than match every pod', () => {
      const replicaSet = createWithStore([pod('a'), pod('b'), pod('c')], { spec: {} });

      expect(replicaSet.podsInStore).toBeUndefined();
      expect(replicaSet.$getters.matching).toHaveBeenCalledTimes(0);
    });
  });

  describe('fetchGlancePods', () => {
    const createWithPods = (fetched: () => Promise<any>) => {
      const replicaSet = createReplicaSet({ spec: { replicas: 3 } });

      replicaSet.metadata.resourceVersion = '100';
      replicaSet.matchingPods = jest.fn(fetched);

      return replicaSet;
    };

    it('should fetch the pods of the ReplicaSet', async() => {
      const pods = [{ id: 'default/a' }];
      const replicaSet = createWithPods(() => Promise.resolve(pods));

      await expect(replicaSet.fetchGlancePods()).resolves.toStrictEqual(pods);
      expect(replicaSet.matchingPods).toHaveBeenCalledWith();
    });

    it('should not fetch them again when the card opens again and the ReplicaSet has not changed', async() => {
      const pods = [{ id: 'default/a' }];
      const replicaSet = createWithPods(() => Promise.resolve(pods));

      await replicaSet.fetchGlancePods();
      await expect(replicaSet.fetchGlancePods()).resolves.toStrictEqual(pods);
      expect(replicaSet.matchingPods).toHaveBeenCalledTimes(1);
    });

    it('should fetch them again once the ReplicaSet has changed', async() => {
      const replicaSet = createWithPods(() => Promise.resolve([]));

      await replicaSet.fetchGlancePods();
      replicaSet.metadata.resourceVersion = '101';
      await replicaSet.fetchGlancePods();

      expect(replicaSet.matchingPods).toHaveBeenCalledTimes(2);
    });

    it('should keep the pods of each ReplicaSet apart', async() => {
      const first = createWithPods(() => Promise.resolve([{ id: 'default/a' }]));
      const second = createWithPods(() => Promise.resolve([{ id: 'default/b' }]));

      await first.fetchGlancePods();

      await expect(second.fetchGlancePods()).resolves.toStrictEqual([{ id: 'default/b' }]);
    });

    it('should fetch them again after a failure', async() => {
      const replicaSet = createWithPods(() => Promise.reject(new Error('forbidden')));

      await expect(replicaSet.fetchGlancePods()).rejects.toThrow('forbidden');
      await expect(replicaSet.fetchGlancePods()).rejects.toThrow('forbidden');
      expect(replicaSet.matchingPods).toHaveBeenCalledTimes(2);
    });
  });
});
