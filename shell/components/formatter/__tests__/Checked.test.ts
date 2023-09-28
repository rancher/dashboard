import { mount } from '@vue/test-utils';
import Checked from '@shell/components/formatter/Checked.vue';

describe('component: Checked', () => {
  it.each([true, 'abc'])('should display a checkmark when the value is truthy', (value: any) => {
    const wrapper = mount(Checked, { propsData: { value } });
    const checkmark = wrapper.find('.icon-checkmark');

    expect(checkmark.exists()).toBe(true);
  });

  it.each([false, ''])('should not display a checkmark when the value is falsy', (value: any) => {
    const wrapper = mount(Checked, { propsData: { value } });

    const checkmark = wrapper.find('.icon-checkmark');

    expect(checkmark.exists()).toBe(false);
  });
});
