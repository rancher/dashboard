import { mount } from '@vue/test-utils';
import HardwareResourceGauge from '@shell/components/HardwareResourceGauge.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';

describe('component: HardwareResourceGauge', () => {
  const createWrapper = () => mount(HardwareResourceGauge, {
    props: {
      name:     'CPU',
      used:     { total: 10, useful: 2 },
      reserved: { total: 10, useful: 5 },
    },
    global: { stubs: { ConsumptionGauge: true } },
  });

  it('should render a gauge for both the reserved and the used amounts', () => {
    const wrapper = createWrapper();

    expect(wrapper.findAllComponents(ConsumptionGauge)).toHaveLength(2);
  });

  it.each([0, 1])('should render gauge %i with a small bar', (index) => {
    const wrapper = createWrapper();

    const gauge = wrapper.findAllComponents(ConsumptionGauge)[index];

    expect(gauge.props('barSize')).toStrictEqual('small');
  });
});
