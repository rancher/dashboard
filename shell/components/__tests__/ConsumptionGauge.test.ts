import { mount } from '@vue/test-utils';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import PercentageBar from '@shell/components/PercentageBar.vue';

describe('component: ConsumptionGauge', () => {
  it('should render component with the correct data applied', () => {
    const colorStops = {
      0: '--success', 30: '--warning', 70: '--error'
    };

    const wrapper = mount(ConsumptionGauge, {
      props: {
        resourceName: 'some-resource-name',
        capacity:     1000,
        used:         200,
        units:        'cores',
        colorStops
      },
    });

    const mainWrapper = wrapper.find('.consumption-gauge');
    const title = wrapper.find('.consumption-gauge h3');
    const usedSpan = wrapper.find('.consumption-gauge .numbers span:nth-child(1)');
    const percentageSpan = wrapper.find('.consumption-gauge .percentage');
    const percentageBar = wrapper.findComponent(PercentageBar);

    expect(mainWrapper.exists()).toBe(true);
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('some-resource-name');
    expect(usedSpan.exists()).toBe(true);
    // check translation key as for translation are not applied
    expect(usedSpan.text()).toBe('%node.detail.glance.consumptionGauge.used%');

    expect(percentageSpan.exists()).toBe(true);
    expect(percentageSpan.text()).toContain('20%');

    // checking PercentageBar component render
    expect(percentageBar.exists()).toBe(true);
    expect(percentageBar.props().modelValue).toBe(20);
    expect(percentageBar.props().colorStops).toStrictEqual(colorStops);
  });

  it('usedAsResourceName should render secondary title instead of main h3 title', () => {
    const colorStops = {
      0: '--success', 30: '--warning', 70: '--error'
    };

    const wrapper = mount(ConsumptionGauge, {
      props: {
        resourceName:       'some-resource-name',
        capacity:           1000,
        used:               200,
        units:              'cores',
        colorStops,
        usedAsResourceName: true
      }
    });

    const mainTitle = wrapper.find('.consumption-gauge h3');
    const slotTitle = wrapper.find('.consumption-gauge h4');

    expect(mainTitle.exists()).toBe(false);
    expect(slotTitle.exists()).toBe(true);
    expect(slotTitle.text()).toBe('some-resource-name');
  });

  it('passing slot TITLE should render correctly', () => {
    const colorStops = {
      0: '--success', 30: '--warning', 70: '--error'
    };

    const wrapper = mount(ConsumptionGauge, {
      props: {
        resourceName: 'some-resource-name',
        capacity:     1000,
        used:         200,
        units:        'cores',
        colorStops
      },
      slots: { title: '<p class="slot-class">another title</p>' }
    });

    const slotElem = wrapper.find('.consumption-gauge .slot-class');

    expect(slotElem.exists()).toBe(true);
    expect(slotElem.text()).toBe('another title');
  });
});
