import { mount } from '@vue/test-utils';
import RcDrawerCard from './RcDrawerCard.vue';

describe('component: RcDrawerCard', () => {
  it('should render its default slot', () => {
    const wrapper = mount(RcDrawerCard, { slots: { default: '<p class="content">Card content</p>' } });

    expect(wrapper.find('.rc-drawer-card .content').text()).toBe('Card content');
  });

  it('should not own the spacing between stacked cards', () => {
    // The drawer body owns the gap, so a consumer cannot forget it and the card
    // does not need a shell-only spacing utility that the published package
    // does not ship.
    const wrapper = mount(RcDrawerCard);

    expect(wrapper.attributes('style')).toBeUndefined();
    expect(wrapper.classes()).toStrictEqual(['rc-drawer-card']);
  });
});
