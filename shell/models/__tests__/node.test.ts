import Node from '@shell/models/cluster/node';
import { METRIC, POD } from '@shell/config/types';
import { PaginationArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';

describe('class Node', () => {
  const resetMocks = () => {
    // Clear all mock function calls:
    jest.clearAllMocks();
  };

  it.each([
    ['1200', 1200],
    ['1k', 1000]
  ])('given %p status pod capacity value from the backend, should parse the value correctly as %p', (value, result) => {
    const node = new Node({ status: { capacity: { pods: value } } });

    expect(node.podCapacity).toStrictEqual(result);
    resetMocks();
  });

  describe('popover', () => {
    const RUNNING_PODS_COUNT = 'nodeRunningPods/local/node-1';

    const BASE_GLANCE = [
      { name: 'state' },
      { name: 'type' },
      { name: 'namespace' },
      { name: 'age' },
    ];

    interface NodeOptions {
      metrics?: any;
      hasMetricsSchema?: boolean;
      canViewPods?: boolean;
      paginated?: boolean;
      pods?: any[];
      savedCounts?: Record<string, number>;
    }

    const createNode = (data: any = {}, {
      metrics, hasMetricsSchema = true, canViewPods = true, paginated = false, pods = [], savedCounts = {}
    }: NodeOptions = {}) => {
      const dispatch = jest.fn();
      const schemas: Record<string, any> = {
        [METRIC.NODE]: hasMetricsSchema ? { id: METRIC.NODE } : undefined,
        [POD]:         canViewPods ? { id: POD } : undefined,
      };
      const rootGetters = {
        'i18n/t':                    (key: string) => key,
        'cluster/byId':              jest.fn(() => metrics),
        'cluster/schemaFor':         jest.fn((type: string) => schemas[type]),
        'cluster/paginationEnabled': jest.fn(() => paginated),
        'cluster/getSavedCount':     jest.fn((name: string) => savedCounts[name]),
        'cluster/all':               jest.fn(() => pods),
        clusterId:                   'local',
        currentCluster:              { metadata: { labels: {} }, provisioner: 'k3s' },
      };
      const node = new Node({
        id:       'node-1',
        metadata: { name: 'node-1', annotations: {} },
        status:   {
          addresses:   [],
          allocatable: { cpu: '4', memory: '8Gi' },
          capacity:    {
            cpu: '4', memory: '8Gi', pods: '110'
          },
          nodeInfo: {},
        },
        ...data
      }, { dispatch, rootGetters });

      return {
        node, dispatch, rootGetters
      };
    };

    const withBaseGlance = (node: any, glance = BASE_GLANCE) => {
      Object.defineProperty(node, '_glance', { get: () => glance });

      return node;
    };

    const rowNames = (glance: any[]) => glance.map((row: any) => row.name);

    const rowByName = (glance: any[], name: string) => glance.find((row: any) => row.name === name);

    describe('glance', () => {
      it('should add the node rows between the type and age rows, without a namespace row', () => {
        const { node } = createNode();

        expect(rowNames(withBaseGlance(node).glance)).toStrictEqual(['state', 'type', 'externalIp', 'internalIp', 'version', 'os', 'age']);
      });

      it('should add the node rows at the end when there is no age row', () => {
        const { node } = createNode();

        expect(rowNames(withBaseGlance(node, [{ name: 'state' }, { name: 'type' }]).glance)).toStrictEqual(['state', 'type', 'externalIp', 'internalIp', 'version', 'os']);
      });

      it('should not change the rows of the base glance', () => {
        const { node } = createNode();
        const base = [...BASE_GLANCE];

        const glance = withBaseGlance(node, base).glance;

        expect(glance).not.toBe(base);
        expect(rowNames(base)).toStrictEqual(['state', 'type', 'namespace', 'age']);
      });

      it.each([
        ['externalIp', 'ExternalIP', 'component.resource.detail.glance.externalIp'],
        ['internalIp', 'InternalIP', 'component.resource.detail.glance.internalIp'],
      ])('should show the %p row as an IP that can be copied', (name, type, label) => {
        const { node } = createNode({ status: { addresses: [{ type, address: '10.0.0.1' }], nodeInfo: {} } });

        expect(rowByName(withBaseGlance(node).glance, name)).toStrictEqual({
          name,
          label,
          formatter: 'CopyToClipboard',
          content:   '10.0.0.1'
        });
      });

      it.each(['externalIp', 'internalIp'])('should show a dash without a copy button when the node has no %p', (name) => {
        const { node } = createNode();
        const row = rowByName(withBaseGlance(node).glance, name);

        expect(row.formatter).toBeUndefined();
        expect(row.content).toStrictEqual('—');
      });

      it('should show the external IP from the annotation when the node has no external address', () => {
        const { node } = createNode({ metadata: { name: 'node-1', annotations: { 'rke.cattle.io/external-ip': '1.2.3.4' } } });

        expect(rowByName(withBaseGlance(node).glance, 'externalIp').content).toStrictEqual('1.2.3.4');
      });

      it.each([
        ['version', { kubeletVersion: 'v1.33.1+k3s1' }, 'v1.33.1+k3s1'],
        ['os', { osImage: 'Ubuntu 24.04 LTS' }, 'Ubuntu 24.04 LTS'],
        ['version', {}, '—'],
        ['os', {}, '—'],
      ])('should show the %p row from the node info %p as %p', (name, nodeInfo, content) => {
        const { node } = createNode({ status: { addresses: [], nodeInfo } });

        expect(rowByName(withBaseGlance(node).glance, name).content).toStrictEqual(content);
      });
    });

    describe('glanceUsage', () => {
      const percentageOf = (node: any, name: string) => node.glanceUsage.find((item: any) => item.name === name).percentage;

      const pod = (nodeName: string, state: string) => ({ spec: { nodeName }, state });

      const runningPods = (count: number, nodeName = 'node-1') => Array.from({ length: count }, () => pod(nodeName, 'running'));

      it('should return the CPU, memory and pods usage in that order', () => {
        const { node } = createNode();

        expect(node.glanceUsage.map((item: any) => [item.name, item.label])).toStrictEqual([
          ['cpu', 'component.resource.detail.glance.cpu'],
          ['memory', 'component.resource.detail.glance.memory'],
          ['pods', 'component.resource.detail.glance.pods'],
        ]);
      });

      it.each([
        ['cpu', { usage: { cpu: '1', memory: '0' } }, 25],
        ['memory', { usage: { cpu: '0', memory: '2Gi' } }, 25],
      ])('should work out the %p usage from the metrics of the node', (name, metrics, expected) => {
        const { node } = createNode({}, { metrics });

        expect(percentageOf(node, name)).toStrictEqual(expected);
      });

      it.each([
        ['cpu', undefined],
        ['memory', undefined],
        ['cpu', { usage: {} }],
        ['memory', { usage: {} }],
      ])('should not have a %p usage when there are no metrics %p', (name, metrics) => {
        const { node } = createNode({}, { metrics });

        expect(percentageOf(node, name)).toBeUndefined();
      });

      it.each([
        ['cpu', { allocatable: { memory: '8Gi' }, capacity: { memory: '8Gi' } }],
        ['memory', { allocatable: { cpu: '4' }, capacity: { cpu: '4' } }],
      ])('should not have a %p usage when the node has no capacity', (name, status) => {
        const { node } = createNode({
          status: {
            addresses: [], nodeInfo: {}, ...status
          }
        }, { metrics: { usage: { cpu: '1', memory: '2Gi' } } });

        expect(percentageOf(node, name)).toBeUndefined();
      });

      describe('pods, without server-side pagination', () => {
        it('should count the running pods on the node in the store, like the Nodes list', () => {
          const pods = [
            ...runningPods(11),
            pod('node-1', 'crashLoopBackOff'),
            pod('node-1', 'completed'),
            ...runningPods(5, 'node-2'),
          ];
          const { node } = createNode({}, { pods });

          expect(percentageOf(node, 'pods')).toStrictEqual(10);
          expect(percentageOf(node, 'pods')).toStrictEqual(Number.parseFloat(node.podConsumedUsage));
        });

        it.each([
          ['has no pods', []],
          ['has no running pods', [pod('node-1', 'crashLoopBackOff')]],
        ])('should not have a pods usage when the node %s, like the Nodes list shows n/a', (_, pods) => {
          const { node } = createNode({}, { pods });

          expect(percentageOf(node, 'pods')).toBeUndefined();
        });

        it('should not use a saved count of the running pods', () => {
          const { node, rootGetters } = createNode({}, { pods: runningPods(11), savedCounts: { [RUNNING_PODS_COUNT]: 55 } });

          expect(percentageOf(node, 'pods')).toStrictEqual(10);
          expect(rootGetters['cluster/getSavedCount'].mock.calls).toStrictEqual([]);
        });
      });

      describe('pods, with server-side pagination', () => {
        it.each([
          [11, 10],
          [55, 50],
          [220, 200],
        ])('should work out the pods usage from %p running pods counted by the API', (count, expected) => {
          const { node, rootGetters } = createNode({}, { paginated: true, savedCounts: { [RUNNING_PODS_COUNT]: count } });

          expect(percentageOf(node, 'pods')).toStrictEqual(expected);
          expect(rootGetters['cluster/paginationEnabled']).toHaveBeenCalledWith(POD);
        });

        it('should not count the pods in the store, which are only a page of pods', () => {
          const { node, rootGetters } = createNode({}, { paginated: true, pods: runningPods(11) });

          expect(percentageOf(node, 'pods')).toBeUndefined();
          expect(rootGetters['cluster/all'].mock.calls).toStrictEqual([]);
        });

        it.each([
          ['has not been counted yet', {}],
          ['is zero, like the Nodes list shows n/a', { [RUNNING_PODS_COUNT]: 0 }],
          ['was counted in another cluster', { 'nodeRunningPods/c-m-abcdef/node-1': 11 }],
        ])('should not have a pods usage when the count of running pods %s', (_, savedCounts) => {
          const { node } = createNode({}, { paginated: true, savedCounts });

          expect(percentageOf(node, 'pods')).toBeUndefined();
        });
      });

      it.each([
        ['zero', false, { pods: '0' }],
        ['missing', false, {}],
        ['zero', true, { pods: '0' }],
        ['missing', true, {}],
      ])('should not have a pods usage when the pod capacity is %s (server-side pagination: %p)', (_, paginated, capacity) => {
        const { node } = createNode({
          status: {
            addresses: [], nodeInfo: {}, capacity
          }
        }, {
          paginated, pods: runningPods(11), savedCounts: { [RUNNING_PODS_COUNT]: 11 }
        });

        expect(percentageOf(node, 'pods')).toBeUndefined();
      });
    });

    describe('fetchGlanceResources', () => {
      const METRICS_FETCH = ['cluster/find', {
        type: METRIC.NODE,
        id:   'node-1',
        opt:  { force: true, watch: false }
      }, { root: true }];

      const ALL_PODS_FETCH = ['cluster/findAll', { type: POD }, { root: true }];

      const RUNNING_PODS_COUNT_FETCH = ['cluster/findPage', {
        type: POD,
        opt:  {
          transient:   true,
          saveCountAs: RUNNING_PODS_COUNT,
          pagination:  new PaginationArgs({
            page:     1,
            pageSize: 1,
            filters:  [
              PaginationParamFilter.createSingleField({ field: 'spec.nodeName', value: 'node-1' }),
              PaginationParamFilter.createSingleField({ field: 'metadata.state.name', value: 'running' }),
            ]
          })
        }
      }, { root: true }];

      it('should fetch the metrics of the node without watching them, and every pod like the Nodes list', async() => {
        const { node, dispatch } = createNode();

        await node.fetchGlanceResources();

        expect(dispatch.mock.calls).toStrictEqual([METRICS_FETCH, ALL_PODS_FETCH]);
      });

      it('should only count the running pods on the node with server-side pagination, without storing them', async() => {
        const { node, dispatch } = createNode({}, { paginated: true });

        await node.fetchGlanceResources();

        expect(dispatch.mock.calls).toStrictEqual([METRICS_FETCH, RUNNING_PODS_COUNT_FETCH]);
      });

      it('should not fetch metrics when the cluster has no metrics API', async() => {
        const { node, dispatch, rootGetters } = createNode({}, { hasMetricsSchema: false });

        await node.fetchGlanceResources();

        expect(rootGetters['cluster/schemaFor']).toHaveBeenCalledWith(METRIC.NODE);
        expect(dispatch.mock.calls).toStrictEqual([ALL_PODS_FETCH]);
      });

      it.each([false, true])('should not fetch pods when the user can not see them (server-side pagination: %p)', async(paginated) => {
        const { node, dispatch, rootGetters } = createNode({}, { canViewPods: false, paginated });

        await node.fetchGlanceResources();

        expect(rootGetters['cluster/schemaFor']).toHaveBeenCalledWith(POD);
        expect(dispatch.mock.calls).toStrictEqual([METRICS_FETCH]);
      });

      it('should fetch nothing when the user can see neither metrics nor pods', async() => {
        const { node, dispatch } = createNode({}, { hasMetricsSchema: false, canViewPods: false });

        await expect(node.fetchGlanceResources()).resolves.toBeUndefined();
        expect(dispatch.mock.calls).toStrictEqual([]);
      });

      it('should still count the pods, and then reject, when the metrics can not be fetched', async() => {
        const { node, dispatch } = createNode({}, { paginated: true });

        dispatch.mockImplementation((action: string) => (action === 'cluster/find' ? Promise.reject(new Error('forbidden')) : Promise.resolve()));

        await expect(node.fetchGlanceResources()).rejects.toThrow('forbidden');
        expect(dispatch.mock.calls).toStrictEqual([METRICS_FETCH, RUNNING_PODS_COUNT_FETCH]);
      });
    });
  });
});
