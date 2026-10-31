import { h } from 'vue';
import { mount } from '@vue/test-utils';
import RcDrawer from '../RcDrawer.vue';
import RcDrawerFooter from '../RcDrawerFooter.vue';

const mountDrawerWithFooter = (actions: () => ReturnType<typeof h>[] = () => []) => mount(RcDrawer, {
  props: { title: 'my-config (ConfigMap)' },
  slots: { footer: () => h(RcDrawerFooter, null, { default: actions }) },
});

const editConfig = () => [h('button', { 'data-testid': 'edit' }, 'Edit Config')];

describe('component: RcDrawerFooter', () => {
  it('should show a Close button', () => {
    const wrapper = mountDrawerWithFooter();

    expect(wrapper.find('[data-testid="rc-drawer-footer"] button').text()).toBe('%component.drawer.chrome.close%');
  });

  it('should name its Close button after the drawer', () => {
    const wrapper = mountDrawerWithFooter();

    expect(wrapper.find('[data-testid="rc-drawer-footer"] button').attributes('aria-label')).toBe('component.drawer.chrome.ariaLabel.close-{"target":"my-config (ConfigMap)"}');
  });

  it('should close the drawer from its Close button', async() => {
    const wrapper = mountDrawerWithFooter();

    await wrapper.find('[data-testid="rc-drawer-footer"] button').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should render its actions after the Close button', () => {
    const wrapper = mountDrawerWithFooter(editConfig);
    const buttons = wrapper.findAll('[data-testid="rc-drawer-footer"] button');

    expect(buttons.map((b) => b.text())).toStrictEqual(['%component.drawer.chrome.close%', 'Edit Config']);
  });

  it('should render a Close button with no name of its own outside a drawer', () => {
    const wrapper = mount(RcDrawerFooter, { slots: { default: editConfig } });
    const close = wrapper.find('button');

    expect(close.text()).toBe('%component.drawer.chrome.close%');
    expect(close.attributes('aria-label')).toBeUndefined();
  });
});
