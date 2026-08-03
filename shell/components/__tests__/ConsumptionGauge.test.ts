import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import IntlMessageFormat from 'intl-messageformat';
import { mount } from '@vue/test-utils';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import PercentageBar from '@shell/components/PercentageBar.vue';
import { formatSi } from '@shell/utils/units';

const AMOUNT_KEY = 'node.detail.glance.consumptionGauge.amount';

// Read the template out of en-us.yaml rather than hard-coding it, so the test exercises
// the string that actually ships and can't pass against a reverted translation file
const translations = yaml.load(
  fs.readFileSync(path.resolve(__dirname, '../../assets/translations/en-us.yaml'), 'utf8')
) as any;
const amountTemplate = translations.node.detail.glance.consumptionGauge.amount;

describe('component: ConsumptionGauge', () => {
  describe('memory amounts', () => {
    // Same wiring as the memory gauge in shell/detail/node.vue
    const memoryFormatter = (value: number) => formatSi(value, {
      increment:   1024,
      suffix:      'iB',
      firstSuffix: 'B',
    });

    const renderMemoryGauge = (capacity: number, used: number) => mount(ConsumptionGauge, {
      props: {
        resourceName:    'MEMORY',
        capacity,
        used,
        numberFormatter: memoryFormatter,
      },
      global: { mocks: { t: (key: string, opts?: Record<string, string>) => key === AMOUNT_KEY ? new IntlMessageFormat(amountTemplate, 'en-US').format(opts) as string : `%${ key }%` } }
    }).find('.numbers-stats').text();

    it.each([
      ['used and total share a unit', 15 * 1024 ** 3, 3.55 * 1024 ** 3, '3.55 GiB of 15 GiB'],
      ['used is smaller than total', 62 * 1024 ** 3, 900 * 1024 ** 2, '900 MiB of 62 GiB'],
      ['used is much smaller than total', 1.97 * 1024 ** 4, 976 * 1024 ** 2, '976 MiB of 1.97 TiB'],
      ['both values are plain bytes', 512, 100, '100 B of 512 B'],
    ])('should label each value with its own unit when %s', (_, capacity, used, expected) => {
      expect(renderMemoryGauge(capacity as number, used as number)).toContain(expected);
    });
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
