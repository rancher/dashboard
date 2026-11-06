import { shallowMount } from '@vue/test-utils';
import PercentageBar from '@shell/components/formatter/PercentageBar.vue';
import PercentageBarComponent from '@shell/components/PercentageBar.vue';
import { USAGE_COLOR_STOPS } from '@shell/utils/color';

describe('formatter: PercentageBar', () => {
  it('should show the bar with the colours of the cluster dashboard', () => {
    const wrapper = shallowMount(PercentageBar, { props: { value: '74' } });
    const bar = wrapper.findComponent(PercentageBarComponent);

    expect(bar.props('modelValue')).toStrictEqual(74);
    expect(bar.props('colorStops')).toStrictEqual(USAGE_COLOR_STOPS);
  });

  it.each(['', '0', 'NaN'])('should have no bar for the value %p', (value) => {
    const wrapper = shallowMount(PercentageBar, { props: { value } });

    expect(wrapper.findComponent(PercentageBarComponent).exists()).toBe(false);
  });
});
