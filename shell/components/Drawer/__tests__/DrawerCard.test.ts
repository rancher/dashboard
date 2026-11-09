import { mount } from '@vue/test-utils';
import DrawerCard from '@shell/components/Drawer/DrawerCard.vue';
import { RcDrawerCard } from '@components/RcDrawer';

describe('component: DrawerCard', () => {
  it('should render its content in an RcDrawerCard', () => {
    const wrapper = mount(DrawerCard, { slots: { default: '<p data-testid="content">Content</p>' } });

    expect(wrapper.findComponent(RcDrawerCard).find('[data-testid="content"]').exists()).toBe(true);
  });
});
