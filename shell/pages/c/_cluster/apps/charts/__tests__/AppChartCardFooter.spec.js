import { shallowMount } from '@vue/test-utils';
import AppChartCardFooter from '../AppChartCardFooter.vue';
import { REPO } from '@shell/config/query-params';

describe('component: AppChartCardFooter', () => {
  it('should render', () => {
    const wrapper = shallowMount(AppChartCardFooter, {
      propsData: { items: [] },
      stubs:     { 'rc-item-card-action': true },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should apply tooltips to labels', () => {
    const tooltipContent = 'my tooltip';
    const items = [
      {
        type:         REPO,
        labels:       ['label1', 'label2'],
        labelTooltip: tooltipContent,
      },
    ];

    const wrapper = shallowMount(AppChartCardFooter, {
      propsData:  { items },
      stubs:      { 'rc-item-card-action': true },
      directives: {
        'clean-tooltip': (el, binding) => {
          el.setAttribute('data-tooltip-value', binding.value);
        },
      },
    });

    const actions = wrapper.findAll('[data-tooltip-value]');

    expect(actions).toHaveLength(2);
    expect(actions.at(0).attributes('data-tooltip-value')).toBe(tooltipContent);
    expect(actions.at(1).attributes('data-tooltip-value')).toBe(tooltipContent);
  });
});
