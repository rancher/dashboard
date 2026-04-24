import { shallowMount } from '@vue/test-utils';
import node from '@shell/detail/node.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';

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
    cpuCapacity:        4,
    cpuUsage:           2,
    ramReserved:        8000,
    ramUsage:           4000,
    podCapacity:        110,
    podConsumed:        5,
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

  function findGaugeByResource(wrapper: ReturnType<typeof createWrapper>, resourceKey: string) {
    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    return gauges.find(
      (g) => g.attributes('resourcename')?.includes(resourceKey)
    );
  }

  it('should pass the "running" translation key as usedlabel to the pods ConsumptionGauge', () => {
    const wrapper = createWrapper();

    const podsGauge = findGaugeByResource(wrapper, 'consumptionGauge.pods');

    expect(podsGauge).toBeDefined();
    expect(podsGauge!.attributes('usedlabel')).toContain('consumptionGauge.running');
  });

  it('should NOT pass a usedlabel to the CPU ConsumptionGauge', () => {
    const wrapper = createWrapper();

    const cpuGauge = findGaugeByResource(wrapper, 'consumptionGauge.cpu');

    expect(cpuGauge).toBeDefined();
    expect(cpuGauge!.attributes('usedlabel')).toBeUndefined();
  });

  it('should NOT pass a usedlabel to the Memory ConsumptionGauge', () => {
    const wrapper = createWrapper();

    const memoryGauge = findGaugeByResource(wrapper, 'consumptionGauge.memory');

    expect(memoryGauge).toBeDefined();
    expect(memoryGauge!.attributes('usedlabel')).toBeUndefined();
  });
});
