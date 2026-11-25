import Node, { primaryNodeIps } from '@shell/models/cluster/node';
import { METRIC } from '@shell/config/types';

describe('class Node', () => {
  describe('usage and resources', () => {
    const CONTROL_PLANE = 'node-role.kubernetes.io/control-plane';
    const CONTROL_PLANE_OLD = 'node-role.kubernetes.io/controlplane';
    const ETCD = 'node-role.kubernetes.io/etcd';
    const WORKER = 'node-role.kubernetes.io/worker';

    const createNode = ({
      status = {}, spec = {}, labels = {}, metrics, annotations = {}
    }: any = {}) => new Node({
      id:       'node-1',
      metadata: {
        name: 'node-1', labels, annotations
      },
      spec,
      status: {
        allocatable: {
          cpu: '3', memory: '6Gi', pods: '100'
        },
        capacity: {
          cpu: '4', memory: '8Gi', pods: '110'
        },
        ...status
      },
    }, { rootGetters: { 'cluster/byId': () => metrics } });

    it('should work out the CPU and memory usage percentages out of the capacity, rather than the allocatable', () => {
      const node = createNode({ metrics: { usage: { cpu: '1', memory: '2Gi' } } });

      expect([node.cpuUsagePercentage, node.ramUsagePercentage]).toStrictEqual(['25', '25']);
    });

    it('should have no usage without metrics', () => {
      const node = createNode();

      expect([node.usage, node.cpuUsage, node.ramUsage]).toStrictEqual([undefined, 0, 0]);
    });

    it('should only get the usage from the metrics, what the pods request is the reserved', () => {
      const annotations = { 'management.cattle.io/pod-requests': JSON.stringify({ cpu: '3', memory: '6Gi' }) };
      const node = createNode({ annotations });

      expect([node.usage, node.cpuUsage, node.ramUsage]).toStrictEqual([undefined, 0, 0]);
      expect([node.cpuReserved, node.ramReserved]).toStrictEqual([3, 6 * 1024 ** 3]);
    });

    it('should sort by the CPU and memory usage out of the capacity', () => {
      const node = createNode({ metrics: { usage: { cpu: '1', memory: '2Gi' } } });

      expect([node.cpuUsageRatio, node.ramUsageRatio]).toStrictEqual([0.25, 0.25]);
    });

    it('should sort a node without a capacity as no usage', () => {
      const node = createNode({ status: { capacity: {} }, metrics: { usage: { cpu: '1', memory: '2Gi' } } });

      expect([node.cpuUsageRatio, node.ramUsageRatio]).toStrictEqual([0, 0]);
    });

    it.each([
      [{ allocatable: { pods: '100' } }, 100],
      [{ allocatable: { pods: '1k' } }, 1000],
      [{ allocatable: {} }, 0],
    ])('given the status %p, should have %p allocatable pods', (status, result) => {
      const node = createNode({ status });

      expect(node.podAllocatable).toStrictEqual(result);
    });

    it('should work out the pods usage from the pods Rancher counts on the node, out of the allocatable rather than the capacity', () => {
      const node = createNode({ annotations: { 'management.cattle.io/pod-requests': JSON.stringify({ pods: '25' }) } });

      expect([node.podReserved, node.podUsagePercentage]).toStrictEqual([25, '25']);
    });

    it('should have no CPU or memory when the status has none, so the cluster dashboard can still sum the nodes', () => {
      const node = createNode({ status: { capacity: {}, allocatable: {} } });

      expect([node.cpuCapacity, node.cpuAllocatable, node.ramCapacity, node.ramAllocatable]).toStrictEqual([0, 0, 0, 0]);
    });

    it.each([
      ['a worker', { [WORKER]: 'true' }, [], false, true],
      ['a node without a role, e.g. in an imported cluster', {}, [], false, true],
      ['a cordoned worker', { [WORKER]: 'true' }, [], true, false],
      ['a control plane node without a taint, e.g. a k3s server', { [CONTROL_PLANE]: 'true', [ETCD]: 'true' }, [], false, true],
      ['a control plane node tainted NoSchedule', { [CONTROL_PLANE]: 'true' }, [{ key: CONTROL_PLANE, effect: 'NoSchedule' }], false, false],
      ['an etcd node tainted NoExecute', { [ETCD]: 'true' }, [{ key: ETCD, effect: 'NoExecute' }], false, false],
      ['an RKE1 control plane node tainted NoSchedule', { [CONTROL_PLANE_OLD]: 'true' }, [{ key: CONTROL_PLANE_OLD, effect: 'NoSchedule' }], false, false],
      ['a tainted control plane node that is also a worker', { [CONTROL_PLANE]: 'true', [WORKER]: 'true' }, [{ key: CONTROL_PLANE, effect: 'NoSchedule' }], false, true],
      ['a control plane node tainted PreferNoSchedule', { [CONTROL_PLANE]: 'true' }, [{ key: CONTROL_PLANE, effect: 'PreferNoSchedule' }], false, true],
      ['a control plane node with a taint of another key', { [CONTROL_PLANE]: 'true' }, [{ key: 'nvidia.com/gpu', effect: 'NoSchedule' }], false, true],
      ['a worker with a NoSchedule taint of another key', { [WORKER]: 'true' }, [{ key: 'nvidia.com/gpu', effect: 'NoSchedule' }], false, true],
    ])('should count %p in the cluster resources: %p %p, cordoned %p -> %p', (_, labels, taints, unschedulable, result) => {
      const node = createNode({ labels, spec: { taints, unschedulable } });

      expect(node.isCountedInClusterResources).toStrictEqual(result);
    });
  });

  describe('popover', () => {
    const BASE_GLANCE = [
      { name: 'state' },
      { name: 'type' },
      { name: 'namespace' },
      { name: 'age' },
    ];

    interface NodeOptions {
      metrics?: any;
      hasMetricsSchema?: boolean;
    }

    const createNode = (data: any = {}, { metrics, hasMetricsSchema = true }: NodeOptions = {}) => {
      const dispatch = jest.fn();
      const schemas: Record<string, any> = { [METRIC.NODE]: hasMetricsSchema ? { id: METRIC.NODE } : undefined };
      const rootGetters = {
        'i18n/t':            (key: string) => key,
        'cluster/byId':      jest.fn(() => metrics),
        'cluster/schemaFor': jest.fn((type: string) => schemas[type]),
        clusterId:           'local',
        currentCluster:      { metadata: { labels: {} }, provisioner: 'k3s' },
      };
      const node = new Node({
        id:       'node-1',
        metadata: { name: 'node-1', annotations: {} },
        status:   {
          addresses:   [],
          allocatable: {
            cpu: '4', memory: '8Gi', pods: '110'
          },
          capacity: {
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

      it('should work out the pods usage from the pods Rancher counts on the node, like the Nodes list and the cluster dashboard', () => {
        const { node } = createNode({ metadata: { name: 'node-1', annotations: { 'management.cattle.io/pod-requests': JSON.stringify({ pods: '11' }) } } });

        expect(percentageOf(node, 'pods')).toStrictEqual(10);
        expect(percentageOf(node, 'pods')).toStrictEqual(Number.parseFloat(node.podUsagePercentage));
      });

      it.each([
        ['no count of the pods on it', { metadata: { name: 'node-1', annotations: {} } }],
        ['no pods on it, like the Nodes list shows n/a', { metadata: { name: 'node-1', annotations: { 'management.cattle.io/pod-requests': JSON.stringify({ pods: '0' }) } } }],
        ['no allocatable pods', {
          metadata: { name: 'node-1', annotations: { 'management.cattle.io/pod-requests': JSON.stringify({ pods: '11' }) } },
          status:   {
            addresses: [], nodeInfo: {}, allocatable: {}
          }
        }],
      ])('should not have a pods usage when the node has %s', (_, data) => {
        const { node } = createNode(data);

        expect(percentageOf(node, 'pods')).toBeUndefined();
      });
    });

    describe('fetchGlanceResources', () => {
      const signal = new AbortController().signal;

      const METRICS_FETCH = ['cluster/find', {
        type: METRIC.NODE,
        id:   'node-1',
        opt:  {
          force: true, watch: false, signal
        }
      }, { root: true }];

      it('should fetch the metrics of the node without watching them', async() => {
        const { node, dispatch } = createNode();

        await node.fetchGlanceResources(signal);

        expect(dispatch.mock.calls).toStrictEqual([METRICS_FETCH]);
      });

      it('should fetch nothing when the cluster has no metrics API', async() => {
        const { node, dispatch, rootGetters } = createNode({}, { hasMetricsSchema: false });

        await expect(node.fetchGlanceResources(signal)).resolves.toBeUndefined();

        expect(rootGetters['cluster/schemaFor']).toHaveBeenCalledWith(METRIC.NODE);
        expect(dispatch.mock.calls).toStrictEqual([]);
      });

      it('should reject when the metrics can not be fetched', async() => {
        const { node, dispatch } = createNode();

        dispatch.mockRejectedValue(new Error('forbidden'));

        await expect(node.fetchGlanceResources(signal)).rejects.toThrow('forbidden');
      });
    });
  });

  describe('labels', () => {
    const nodeWith = (labels?: Record<string, string>) => new Node({ metadata: labels ? { labels } : {} });

    describe('filteredSystemLabels', () => {
      it.each([
        ['no metadata labels', undefined, {}],
        ['an empty label set', {}, {}],
        ['only system labels', {
          'beta.kubernetes.io/arch': 'amd64', 'kubernetes.io/os': 'linux', 'node-role.kubernetes.io/control-plane': 'true'
        }, {}],
        ['only non-system labels', { 'plan.cattle.io/cluster-name': 'local', myLabel: 'myValue' }, { 'plan.cattle.io/cluster-name': 'local', myLabel: 'myValue' }],
        ['a mix of both', {
          'beta.kubernetes.io/arch': 'amd64', 'node.kubernetes.io/instance-type': 'k3s', 'plan.cattle.io/machine-kind': 'Node'
        }, { 'plan.cattle.io/machine-kind': 'Node' }],
        ['a label with an empty value', { 'example.com/empty': '' }, { 'example.com/empty': '' }],
        ['a key whose system prefix is only a substring, not the whole prefix', { 'not-kubernetes.io/thing': 'yes' }, { 'not-kubernetes.io/thing': 'yes' }],
      ])('should drop the system labels given %s', (_, labels, expected) => {
        expect(nodeWith(labels).filteredSystemLabels).toStrictEqual(expected);
      });
    });

    describe('customLabels', () => {
      it('should render the filtered labels as key=value strings', () => {
        const node = nodeWith({ 'plan.cattle.io/cluster-name': 'local', 'kubernetes.io/os': 'linux' });

        expect(node.customLabels).toStrictEqual(['plan.cattle.io/cluster-name=local']);
      });

      it('should show exactly the labels the detail page shows, so the list and the detail page agree', () => {
        const node = nodeWith({
          'beta.kubernetes.io/arch':     'amd64',
          'kubernetes.io/hostname':      'node-1',
          'plan.cattle.io/cluster-name': 'local',
          'plan.cattle.io/machine-kind': 'Node',
        });

        expect(node.customLabels).toStrictEqual(Object.entries(node.filteredSystemLabels).map(([k, v]) => `${ k }=${ v }`));
      });

      it('should be empty when every label is a system label', () => {
        expect(nodeWith({ 'kubernetes.io/os': 'linux' }).customLabels).toStrictEqual([]);
      });
    });

    describe('customLabelCount', () => {
      it.each([
        ['no labels', undefined, 0],
        ['only system labels', { 'kubernetes.io/os': 'linux' }, 0],
        ['a mix of both', { 'kubernetes.io/os': 'linux', 'plan.cattle.io/machine-kind': 'Node' }, 1],
      ])('should count only the non-system labels given %s', (_, labels, expected) => {
        expect(nodeWith(labels).customLabelCount).toStrictEqual(expected);
      });
    });
  });

  describe('IPs', () => {
    const V4_IN = '10.0.0.1';
    const V6_IN = 'fd00::1';
    const V4_EX = '203.0.113.1';
    const V6_EX = '2001:db8::1';

    it.each([
      ['both IPv4 when only IPv4 is external', [V4_EX], [V6_IN, V4_IN], V4_EX, V4_IN],
      ['both IPv6 when only IPv6 is external', [V6_EX], [V4_IN, V6_IN], V6_EX, V6_IN],
      ['both IPv6 when only IPv6 is internal', [V4_EX, V6_EX], [V6_IN], V6_EX, V6_IN],
      ['the family of the first internal IP, IPv4, when both match', [V6_EX, V4_EX], [V4_IN, V6_IN], V4_EX, V4_IN],
      ['the family of the first internal IP, IPv6, when both match', [V4_EX, V6_EX], [V6_IN, V4_IN], V6_EX, V6_IN],
      ['the first of each when no family matches', [V4_EX], [V6_IN], V4_EX, V6_IN],
      ['the first internal IP without an external one', [], [V6_IN, V4_IN], undefined, V6_IN],
      ['the first external IP without an internal one', [V6_EX, V4_EX], [], V6_EX, undefined],
      ['the first of each when they are not IPs', ['host-a', 'host-b'], ['host-c'], 'host-a', 'host-c'],
      ['nothing without IPs', [], [], undefined, undefined],
    ])('should show %s', (_, externalIps, internalIps, externalIp, internalIp) => {
      expect(primaryNodeIps({ externalIps, internalIps })).toStrictEqual({ externalIp, internalIp });
    });

    it.each([
      [[V4_EX], [V6_IN, V4_IN], V4_EX, V4_IN],
      [[V6_EX, V4_EX], [V4_IN], V4_EX, V4_IN],
    ])('should show IPs of the same family and keep the order of the lists, given external %p and internal %p', (externalIps, internalIps, externalIp, internalIp) => {
      const node = new Node({
        metadata: { annotations: {} },
        status:   {
          addresses: [
            ...internalIps.map((address) => ({ type: 'InternalIP', address })),
            ...externalIps.map((address) => ({ type: 'ExternalIP', address })),
            { type: 'Hostname', address: 'node-1' },
          ]
        }
      });

      expect([node.externalIp, node.internalIp]).toStrictEqual([externalIp, internalIp]);
      expect([node.externalIps, node.internalIps]).toStrictEqual([externalIps, internalIps]);
    });

    it('should show the internal IP of a node without annotations', () => {
      const node = new Node({ metadata: {}, status: { addresses: [{ type: 'InternalIP', address: V4_IN }] } });

      expect(node.internalIp).toStrictEqual(V4_IN);
    });
  });
});
