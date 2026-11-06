import { mount } from '@vue/test-utils';
import HardwareResourceGauge from '@shell/components/HardwareResourceGauge.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';

describe('component: HardwareResourceGauge', () => {
  const createWrapper = (props = {}) => mount(HardwareResourceGauge, {
    props: {
      name:     'CPU',
      used:     { total: 10, useful: 2 },
      reserved: { total: 10, useful: 5 },
      ...props,
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

  describe('tooltips', () => {
    // A stub drops the slot the tooltips are in
    const createWrapperWithGauges = (props = {}) => mount(HardwareResourceGauge, {
      props: {
        name:     'CPU',
        used:     { total: 10, useful: 2 },
        reserved: { total: 10, useful: 5 },
        ...props,
      },
    });

    it('should explain used and reserved when given what to say', () => {
      const wrapper = createWrapperWithGauges({ usedTooltip: 'used text', reservedTooltip: 'reserved text' });

      expect(wrapper.find('[data-testid="hardware-resource-gauge-used-tooltip"]').attributes('aria-label')).toStrictEqual('used text');
      expect(wrapper.find('[data-testid="hardware-resource-gauge-reserved-tooltip"]').attributes('aria-label')).toStrictEqual('reserved text');
    });

    it('should reach the tooltips with the keyboard', () => {
      const wrapper = createWrapperWithGauges({ usedTooltip: 'used text', reservedTooltip: 'reserved text' });

      expect(wrapper.find('[data-testid="hardware-resource-gauge-used-tooltip"]').attributes('tabindex')).toStrictEqual('0');
      expect(wrapper.find('[data-testid="hardware-resource-gauge-reserved-tooltip"]').attributes('tabindex')).toStrictEqual('0');
    });

    it('should not show them otherwise, e.g. for the pods gauge', () => {
      const wrapper = createWrapperWithGauges();

      expect(wrapper.find('.icon-info').exists()).toBe(false);
    });
  });
});
