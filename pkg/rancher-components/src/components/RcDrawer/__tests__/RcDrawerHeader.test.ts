import { h } from 'vue';
import type { Slot } from 'vue';
import { mount } from '@vue/test-utils';
import RcDrawer from '../RcDrawer.vue';
import RcDrawerHeader from '../RcDrawerHeader.vue';

const mountDrawerWithHeader = (slots: Record<string, Slot> = {}) => mount(RcDrawer, {
  props: { title: 'my-config (ConfigMap)' },
  slots: { header: () => h(RcDrawerHeader, null, slots) },
});

const closeLabel = 'component.drawer.chrome.ariaLabel.close-{"target":"my-config (ConfigMap)"}';

describe('component: RcDrawerHeader', () => {
  it('should show the drawer title', () => {
    const wrapper = mountDrawerWithHeader();

    expect(wrapper.find('[data-testid="rc-drawer-title"]').text()).toBe('my-config (ConfigMap)');
  });

  it('should make the title a level 2 heading', () => {
    const title = mountDrawerWithHeader().find('[data-testid="rc-drawer-title"]');

    expect(title.attributes('role')).toBe('heading');
    expect(title.attributes('aria-level')).toBe('2');
  });

  it('should show its default slot in place of the title', () => {
    const wrapper = mountDrawerWithHeader({ default: () => [h('span', { 'data-testid': 'custom-title' }, 'Custom')] });

    expect(wrapper.find('[data-testid="rc-drawer-title"]').text()).toBe('Custom');
    expect(wrapper.find('[data-testid="custom-title"]').exists()).toBe(true);
  });

  it('should keep the drawer title as the drawer name when its default slot is used', () => {
    const wrapper = mountDrawerWithHeader({ default: () => [h('a', { href: '#' }, 'my-config')] });

    expect(wrapper.attributes('aria-label')).toBe('my-config (ConfigMap)');
  });

  it('should render its actions between the title and the close button, outside the heading', () => {
    const wrapper = mountDrawerWithHeader({ actions: () => [h('button', { 'data-testid': 'expand' }, 'Expand')] });
    const header = Array.from(wrapper.findAll('[data-testid="rc-drawer-header"] [data-testid]')).map((el) => el.attributes('data-testid'));

    expect(header).toStrictEqual(['rc-drawer-title', 'expand', 'rc-drawer-close']);
    expect(wrapper.find('[data-testid="rc-drawer-title"] [data-testid="expand"]').exists()).toBe(false);
  });

  it('should name its close button after the drawer', () => {
    const wrapper = mountDrawerWithHeader();

    expect(wrapper.find('[data-testid="rc-drawer-close"]').attributes('aria-label')).toBe(closeLabel);
  });

  it('should close the drawer from its close button', async() => {
    const wrapper = mountDrawerWithHeader();

    await wrapper.find('[data-testid="rc-drawer-close"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should render a close button with no name of its own outside a drawer', () => {
    const wrapper = mount(RcDrawerHeader);

    expect(wrapper.find('[data-testid="rc-drawer-close"]').attributes('aria-label')).toBeUndefined();
    expect(wrapper.find('[data-testid="rc-drawer-title"]').text()).toBe('');
  });
});
