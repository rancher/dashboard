import { mount } from '@vue/test-utils';
import Card from '@shell/components/Resource/Detail/Card/index.vue';

describe('component: Card/index', () => {
  it('should render title and default slot', async() => {
    const title = 'title';
    const content = 'content';
    const wrapper = mount(Card, { props: { title }, slots: { default: content } });

    expect(wrapper.find('.title').element.innerHTML).toStrictEqual(title);
  });

  it('should allow you to override the heading with slot', async() => {
    const title = 'title';
    const content = 'content';
    const wrapper = mount(Card, { props: { title }, slots: { heading: content } });

    expect(wrapper.find('.title').exists()).toBeFalsy();
    expect(wrapper.find('.heading').element.innerHTML).toStrictEqual(content);
  });

  it('should allow you to override the title with slot', async() => {
    const title = 'title';
    const content = 'content';
    const wrapper = mount(Card, { props: { title }, slots: { title: content } });

    expect(wrapper.find('.title').element.innerHTML).toStrictEqual(content);
  });

  it('should allow you to insert heading-action with slot', async() => {
    const content = '<div id="test">content</div>';
    const wrapper = mount(Card, { slots: { 'heading-action': content } });

    expect(wrapper.find('.heading #test').exists()).toBeTruthy();
  });
});
