import { mount } from '@vue/test-utils';
import Title from '@shell/components/Resource/Detail/TitleBar/Title.vue';

describe('component: TitleBar/Title', () => {
  it('should render container with class title', async() => {
    const wrapper = mount(Title);

    expect(wrapper.find('.title').exists()).toBeTruthy();
  });

  it('should render default slot', async() => {
    const content = 'CONTENT';
    const wrapper = mount(Title, { slots: { default: content } });

    expect(wrapper.find('.title').element.innerHTML).toStrictEqual(content);
  });
});
