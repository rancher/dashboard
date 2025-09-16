import { mount } from '@vue/test-utils';
import KeyValueRow from '@shell/components/Resource/Detail/Metadata/KeyValueRow.vue';

describe('component: Rectangle', () => {
  it('should render container with class title and missing outline when passed outline:false', async() => {
    const wrapper = mount(KeyValueRow, { props: { type: 'inactive' } });

    expect(wrapper.find('.rectangle').exists()).toBeTruthy();
    expect(wrapper.find('.rectangle.outline').exists()).toBeFalsy();
  });

  it('should render outline class when passed outline:true', async() => {
    const wrapper = mount(KeyValueRow, { props: { type: 'active' } });

    expect(wrapper.find('.rectangle.outline').exists()).toBeTruthy();
  });

  it('should render default slot', async() => {
    const content = 'CONTENT';
    const wrapper = mount(KeyValueRow, { slots: { default: content } });

    expect(wrapper.find('.rectangle').element.innerHTML).toStrictEqual(content);
  });
});
