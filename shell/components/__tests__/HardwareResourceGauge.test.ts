import { mount } from '@vue/test-utils';
import HardwareResourceGauge from '@shell/components/HardwareResourceGauge.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import { RcIconTooltip } from '@components/RcIconTooltip';

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

      expect(wrapper.findAllComponents(RcIconTooltip).map((tooltip) => tooltip.props('content'))).toStrictEqual(['reserved text', 'used text']);
    });

    it.each([
      ['used', 'used text'],
      ['reserved', 'reserved text'],
    ])('should read the %s explanation once, as the description of a button with a generic name', (kind, text) => {
      const wrapper = createWrapperWithGauges({ usedTooltip: 'used text', reservedTooltip: 'reserved text' });
      const button = wrapper.find(`[data-testid="hardware-resource-gauge-${ kind }-tooltip"]`);

      expect(button.element.tagName).toStrictEqual('BUTTON');
      expect(button.attributes('aria-label')).toStrictEqual('%generic.moreInfo%');
      expect(document.getElementById(button.attributes('aria-describedby') as string)?.textContent).toStrictEqual(text);
    });

    it('should not show them otherwise, e.g. for the pods gauge', () => {
      const wrapper = createWrapperWithGauges();

      expect(wrapper.findAllComponents(RcIconTooltip)).toHaveLength(0);
    });
  });
});
