import { shallowMount } from '@vue/test-utils';
import node from '@shell/detail/node.vue';
import HardwareResourceGauge from '@shell/components/HardwareResourceGauge.vue';

describe('view: node detail', () => {
  const mockStore = {
    getters: {
      'cluster/schemaFor':         () => undefined,
      'cluster/paginationEnabled': () => false,
      'type-map/headersFor':       jest.fn(),
      'i18n/t':                    (key: string) => key,
      currentCluster:              { id: 'local' },
    },
    dispatch: jest.fn(),
  };

  const mocks = {
    $store:      mockStore,
    $fetchState: { pending: false },
  };

  const defaultNodeValue = {
    metadata: { name: 'test-node' },
    status:   {
      nodeInfo: {}, images: [], conditions: []
    },
    spec:               { taints: [] },
    pods:               [],
    usage:              { cpu: '2', memory: '4000' },
    cpuCapacity:        5,
    cpuAllocatable:     4,
    cpuReserved:        3,
    cpuUsage:           2,
    ramCapacity:        9000,
    ramAllocatable:     8000,
    ramReserved:        6000,
    ramUsage:           4000,
    podAllocatable:     110,
    podReserved:        5,
    isPidPressureOk:    true,
    isDiskPressureOk:   true,
    isMemoryPressureOk: true,
    isKubeletOk:        true,
    internalIp:         '10.0.0.1',
  };

  function createWrapper(nodeOverrides = {}) {
    return shallowMount(node, {
      props:  { value: { ...defaultNodeValue, ...nodeOverrides } },
      global: { mocks },
    });
  }

  function findGauge(wrapper: ReturnType<typeof createWrapper>, resourceKey: string) {
    return wrapper.findAllComponents(HardwareResourceGauge).find((gauge) => gauge.props('name')?.includes(resourceKey))!;
  }

  it('should show the CPU, memory and pods, in that order', () => {
    const wrapper = createWrapper();

    expect(wrapper.findAllComponents(HardwareResourceGauge).map((gauge) => gauge.props('name'))).toStrictEqual([
      '%node.detail.glance.consumptionGauge.cpu%',
      '%node.detail.glance.consumptionGauge.memory%',
      '%node.detail.glance.consumptionGauge.pods%',
    ]);
  });

  it('should show the pods out of the allocatable, like the cluster dashboard, without reserved', () => {
    const gauge = findGauge(createWrapper(), 'consumptionGauge.pods');

    expect(gauge.props('used')).toStrictEqual({ total: 110, useful: 5 });
    expect(gauge.props('usedTitle')).toBeNull();
    expect(gauge.props('reserved')).toBeNull();
  });

  // The same as the cluster dashboard: reserved is out of the allocatable, used out of the capacity
  it('should show the reserved CPU out of the allocatable and the used CPU out of the capacity', () => {
    const gauge = findGauge(createWrapper(), 'consumptionGauge.cpu');

    expect([gauge.props('reserved')?.total, gauge.props('reserved')?.useful]).toStrictEqual([4, 3]);
    expect([gauge.props('used')?.total, gauge.props('used')?.useful]).toStrictEqual([5, 2]);
  });

  it('should show the reserved memory out of the allocatable and the used memory out of the capacity', () => {
    const gauge = findGauge(createWrapper(), 'consumptionGauge.memory');

    expect([gauge.props('reserved')?.total, gauge.props('reserved')?.useful]).toStrictEqual([8000, 6000]);
    expect([gauge.props('used')?.total, gauge.props('used')?.useful]).toStrictEqual([9000, 4000]);
  });

  it.each([
    'consumptionGauge.cpu',
    'consumptionGauge.memory',
  ])('should not show the used %s of a node without metrics, rather than a usage of 0, but still the reserved', (resourceKey) => {
    const gauge = findGauge(createWrapper({ usage: undefined }), resourceKey);

    expect(gauge.props('used')).toBeNull();
    expect(gauge.props('reserved')).not.toBeNull();
  });

  it.each([
    'consumptionGauge.cpu',
    'consumptionGauge.memory',
  ])('should explain used and reserved on the %s gauge', (resourceKey) => {
    const gauge = findGauge(createWrapper(), resourceKey);

    expect(gauge.props('usedTooltip')).toContain('hardwareResourceGauge.usedTooltip');
    expect(gauge.props('reservedTooltip')).toContain('hardwareResourceGauge.reservedTooltip');
  });

  describe('memory', () => {
    // The used and total values are scaled independently, so each carries its own unit -
    // 900MiB of 62GiB would otherwise read "900 GiB of 62 GiB".
    it.each([
      ['scales each value on its own', 900 * 1024 ** 2, '900 MiB'],
      ['keeps used and total in step when they share a unit', 3.55 * 1024 ** 3, '3.55 GiB'],
      ['reads plain bytes as B rather than iB', 512, '512 B'],
      ['keeps two decimals like the cluster dashboard, so it adds up with the percentage', 15.42 * 1024 ** 3, '15.42 GiB'],
    ])('should format the used amount so it %s', (_, ramUsage, expected) => {
      const gauge = findGauge(createWrapper({ ramUsage }), 'consumptionGauge.memory');

      expect(gauge.props('used')?.formattedUseful).toStrictEqual(expected);
    });

    it('should format the totals of used and reserved on their own', () => {
      const gauge = findGauge(createWrapper({ ramCapacity: 8 * 1024 ** 3, ramAllocatable: 900 * 1024 ** 2 }), 'consumptionGauge.memory');

      expect([gauge.props('used')?.formattedTotal, gauge.props('reserved')?.formattedTotal]).toStrictEqual(['8 GiB', '900 MiB']);
    });
  });
});
