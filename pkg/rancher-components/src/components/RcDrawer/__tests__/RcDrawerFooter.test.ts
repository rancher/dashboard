import { h } from 'vue';
import { mount } from '@vue/test-utils';
import RcDrawer from '../RcDrawer.vue';
import RcDrawerFooter from '../RcDrawerFooter.vue';
import RcDrawerHeader from '../RcDrawerHeader.vue';

type FooterOptions = {
  props?: Record<string, unknown>;
  slots?: Record<string, (props: { close: () => void }) => ReturnType<typeof h>[]>;
};

const mountDrawerWithFooter = ({ props = {}, slots = {} }: FooterOptions = {}) => mount(RcDrawer, {
  slots: {
    header: () => h(RcDrawerHeader, { title: 'my-config (ConfigMap)' }),
    footer: () => h(RcDrawerFooter, props, slots),
  },
});

const footerButtons = (wrapper: ReturnType<typeof mountDrawerWithFooter>) => wrapper.findAll('[data-testid="rc-drawer-footer"] button');

describe('component: RcDrawerFooter', () => {
  it('should show a Close button', () => {
    const wrapper = mountDrawerWithFooter();

    expect(footerButtons(wrapper).map((b) => b.text())).toStrictEqual(['%component.drawer.chrome.close%']);
  });

  it('should name its Close button after the drawer', () => {
    const wrapper = mountDrawerWithFooter();

    expect(footerButtons(wrapper)[0].attributes('aria-label')).toBe('component.drawer.chrome.ariaLabel.close-{"target":"my-config (ConfigMap)"}');
  });

  it('should close the drawer from its secondary button', async() => {
    const wrapper = mountDrawerWithFooter();

    await footerButtons(wrapper)[0].trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should label the secondary button with secondaryLabel, named by its label alone', () => {
    const wrapper = mountDrawerWithFooter({ props: { secondaryLabel: 'Cancel' } });
    const secondary = footerButtons(wrapper)[0];

    expect(secondary.text()).toBe('Cancel');
    expect(secondary.attributes('aria-label')).toBeUndefined();
  });

  it('should close the drawer from a relabeled secondary button', async() => {
    const wrapper = mountDrawerWithFooter({ props: { secondaryLabel: 'Cancel' } });

    await footerButtons(wrapper)[0].trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should show a primary button labeled with primaryLabel after the secondary one', () => {
    const wrapper = mountDrawerWithFooter({ props: { primaryLabel: 'Edit Config' } });

    expect(footerButtons(wrapper).map((b) => b.text())).toStrictEqual(['%component.drawer.chrome.close%', 'Edit Config']);
  });

  it('should emit primary from the primary button without closing the drawer', async() => {
    const wrapper = mountDrawerWithFooter({ props: { primaryLabel: 'Edit Config' } });

    await footerButtons(wrapper)[1].trigger('click');

    expect(wrapper.findComponent(RcDrawerFooter).emitted('primary')).toHaveLength(1);
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('should render the primary slot in place of the primary button', () => {
    const wrapper = mountDrawerWithFooter({
      props: { primaryLabel: 'Edit Config' },
      slots: { primary: () => [h('button', { 'data-testid': 'uninstall' }, 'Uninstall'), h('button', { 'data-testid': 'upgrade' }, 'Upgrade')] },
    });

    expect(footerButtons(wrapper).map((b) => b.text())).toStrictEqual(['%component.drawer.chrome.close%', 'Uninstall', 'Upgrade']);
  });

  it('should render the secondary slot in place of the secondary button, with a close function', async() => {
    const wrapper = mountDrawerWithFooter({ slots: { secondary: ({ close }) => [h('button', { 'data-testid': 'back', onClick: close }, 'Back')] } });

    expect(footerButtons(wrapper).map((b) => b.text())).toStrictEqual(['Back']);

    await wrapper.find('[data-testid="back"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should give the primary slot a close function that closes the drawer', async() => {
    const wrapper = mountDrawerWithFooter({ slots: { primary: ({ close }) => [h('button', { 'data-testid': 'done', onClick: close }, 'Done')] } });

    await wrapper.find('[data-testid="done"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should render a Close button with no name of its own outside a drawer', () => {
    const wrapper = mount(RcDrawerFooter);
    const close = wrapper.find('button');

    expect(close.text()).toBe('%component.drawer.chrome.close%');
    expect(close.attributes('aria-label')).toBeUndefined();
  });
});
