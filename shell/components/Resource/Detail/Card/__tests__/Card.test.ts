import { shallowMount } from '@vue/test-utils';
import Card from '@shell/components/Resource/Detail/Card/index.vue';

const mockPush = jest.fn();

jest.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }));

describe('component: Card/index', () => {
  it('should render title and default slot', () => {
    const title = 'title';
    const content = 'content';
    const wrapper = shallowMount(Card, { props: { title }, slots: { default: content } });

    expect(wrapper.find('.title').text()).toStrictEqual(title);
  });

  it('should allow you to override the heading with slot', () => {
    const title = 'title';
    const content = 'content';
    const wrapper = shallowMount(Card, { props: { title }, slots: { heading: content } });

    expect(wrapper.find('.title').exists()).toBeFalsy();
    expect(wrapper.find('.heading').text()).toStrictEqual(content);
  });

  it('should allow you to override the title with slot', () => {
    const title = 'title';
    const content = 'content';
    const wrapper = shallowMount(Card, { props: { title }, slots: { title: content } });

    expect(wrapper.find('.title').text()).toStrictEqual(content);
  });

  it('should allow you to insert heading-action with slot', () => {
    const content = '<div id="test">content</div>';
    const wrapper = shallowMount(Card, { slots: { 'heading-action': content } });

    expect(wrapper.find('.heading #test').exists()).toBeTruthy();
  });

  it('should hide heading when no title or heading slots are provided', () => {
    const wrapper = shallowMount(Card, { slots: { default: 'body' } });

    expect(wrapper.find('.heading').exists()).toBeFalsy();
  });

  describe('click navigation', () => {
    const to = { name: 'test-route', params: { id: '1' } };

    beforeEach(() => {
      mockPush.mockClear();
    });

    it('should navigate when card body is clicked and to prop is set', async() => {
      const wrapper = shallowMount(Card, { props: { to }, slots: { default: '<span>content</span>' } });

      await wrapper.find('.body span').trigger('click');

      expect(mockPush).toHaveBeenCalledWith(to);
    });

    it('should not navigate when no to prop is set', async() => {
      const wrapper = shallowMount(Card, { props: { title: 'test' }, slots: { default: '<span>content</span>' } });

      await wrapper.find('.body span').trigger('click');

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not navigate when clicking on a child anchor element', async() => {
      const wrapper = shallowMount(Card, {
        props: { to },
        slots: { default: '<a href="#" class="inner-link">link</a>' },
      });

      await wrapper.find('.inner-link').trigger('click');

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not navigate when clicking on a child button element', async() => {
      const wrapper = shallowMount(Card, {
        props: { to },
        slots: { default: '<button class="inner-btn">btn</button>' },
      });

      await wrapper.find('.inner-btn').trigger('click');

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should add clickable class when to prop is set', () => {
      const wrapper = shallowMount(Card, { props: { to }, slots: { default: 'body' } });

      expect(wrapper.find('.detail-card').classes()).toContain('clickable');
    });

    it('should not add clickable class when to prop is not set', () => {
      const wrapper = shallowMount(Card, { slots: { default: 'body' } });

      expect(wrapper.find('.detail-card').classes()).not.toContain('clickable');
    });
  });
});
