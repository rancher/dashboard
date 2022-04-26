import { mount } from '@vue/test-utils';
import Banner from '@/components/Banner.vue';

describe('component: Banner', () => {
  it('should display text based on label', async() => {
    const label = 'test';
    const wrapper = mount(Banner);

    await wrapper.setProps({ label });
    const element = wrapper.find('span').element;

    expect(element.textContent).toBe(label);
  });
});
