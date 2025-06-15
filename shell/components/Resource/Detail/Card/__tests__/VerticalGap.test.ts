import { mount } from '@vue/test-utils';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';

describe('component: VerticalGap', () => {
  const wrapper = mount(VerticalGap);

  it('should have appropriate class', async() => {
    expect(wrapper.element.className).toBe('vertical-gap');
  });

  it('should have blank content so the element can have height styled by the class', async() => {
    expect(wrapper.element.innerHTML.trim()).toBe('&nbsp;');
  });
});
