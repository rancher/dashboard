import { mount } from '@vue/test-utils';
import Checked from '@shell/components/formatter/Checked.vue';

describe('component: Checked', () => {
  it.each([true, 'true'])('should display a checkmark when the value is true or "true"', (value: any) => {
    const wrapper = mount(Checked, { props: { value } });
    const checkmark = wrapper.find('.icon-checkmark');

    expect(checkmark.exists()).toBe(true);
  });

  it.each([false, '', 'abc'])('should not display a checkmark when the value is anything other than true or "true"', (value: any) => {
    const wrapper = mount(Checked, { props: { value } });

    const checkmark = wrapper.find('.icon-checkmark');

    expect(checkmark.exists()).toBe(false);
  });
});
