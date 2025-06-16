import { mount } from '@vue/test-utils';
import Rectangle from '@shell/components/Resource/Detail/Metadata/Rectangle.vue';

describe('component: Rectangle', () => {
  it('shoulder render container with class title and missing outline when passed outline:false', async() => {
    const wrapper = mount(Rectangle, { props: { outline: false } });

    expect(wrapper.find('.rectangle').exists()).toBeTruthy();
    expect(wrapper.find('.rectangle.outline').exists()).toBeFalsy();
  });

  it('should render outline class when passed outline:true', async() => {
    const wrapper = mount(Rectangle, { props: { outline: true } });

    expect(wrapper.find('.rectangle.outline').exists()).toBeTruthy();
  });

  it('should render default slot', async() => {
    const content = 'CONTENT';
    const wrapper = mount(Rectangle, { slots: { default: content } });

    expect(wrapper.find('.rectangle').element.innerHTML).toStrictEqual(content);
  });
});
