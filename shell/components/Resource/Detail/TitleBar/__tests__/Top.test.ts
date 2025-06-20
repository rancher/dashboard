import { mount } from '@vue/test-utils';
import Top from '@shell/components/Resource/Detail/TitleBar/Top.vue';

describe('component: TitleBar/Top', () => {
  it('should render container with class top', async() => {
    const wrapper = mount(Top);

    expect(wrapper.find('.top').exists()).toBeTruthy();
  });

  it('should render default slot', async() => {
    const content = 'CONTENT';
    const wrapper = mount(Top, { slots: { default: content } });

    expect(wrapper.find('.top').element.innerHTML).toStrictEqual(content);
  });
});
