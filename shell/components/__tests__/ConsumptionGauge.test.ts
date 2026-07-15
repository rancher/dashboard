import { mount } from '@vue/test-utils';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import PercentageBar from '@shell/components/PercentageBar.vue';

describe('component: ConsumptionGauge', () => {
  it('amountTemplateValues should include unit for both used and total', () => {
    const wrapper = mount(ConsumptionGauge, {
      props: {
        resourceName: 'MEMORY',
        capacity:     16000,
        used:         4000,
        units:        'GiB',
      },
    });

    const values = (wrapper.vm as any).amountTemplateValues;

    expect(values).toStrictEqual({
      used:  4000,
      total: 16000,
      unit:  ' GiB',
    });
  });

  it('amountTemplateValues should have empty unit when units prop is not provided', () => {
    const wrapper = mount(ConsumptionGauge, {
      props: {
        resourceName: 'CPU',
        capacity:     4,
        used:         2,
      },
    });

    const values = (wrapper.vm as any).amountTemplateValues;

    expect(values).toStrictEqual({
      used:  2,
      total: 4,
      unit:  '',
    });
  });

  it('should render the amount string with units on both used and total values', () => {
    const amountTemplate = '{used}{unit} of {total}{unit}';

    const wrapper = mount(ConsumptionGauge, {
      props: {
        resourceName: 'MEMORY',
        capacity:     16000,
        used:         4000,
        units:        'GiB',
      },
      global: {
        mocks: {
          t: (key: string, opts?: Record<string, string>) => {
            if (key === 'node.detail.glance.consumptionGauge.amount' && opts) {
              return amountTemplate
                .replace('{used}', opts.used)
                .replace('{total}', opts.total)
                .replace(/\{unit\}/g, opts.unit);
            }

            return `%${ key }%`;
          }
        }
      }
    });

    const statsText = wrapper.find('.numbers-stats').text();

    expect(statsText).toContain('4000 GiB of 16000 GiB');
  });

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

  it('should display the default "Used" label when usedLabel is not provided', () => {
    const wrapper = mount(ConsumptionGauge, {
      props: {
        resourceName: 'some-resource-name',
        capacity:     100,
        used:         50,
      }
    });

    const usedSpan = wrapper.find('.consumption-gauge .numbers span:nth-child(1)');

    expect(usedSpan.exists()).toBe(true);
    expect(usedSpan.text()).toBe('%node.detail.glance.consumptionGauge.used%');
  });

  it('usedLabel should override the default "Used" label text', () => {
    const wrapper = mount(ConsumptionGauge, {
      props: {
        resourceName: 'some-resource-name',
        capacity:     100,
        used:         50,
        usedLabel:    'Running'
      }
    });

    const usedSpan = wrapper.find('.consumption-gauge .numbers span:nth-child(1)');

    expect(usedSpan.exists()).toBe(true);
    expect(usedSpan.text()).toBe('Running');
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
