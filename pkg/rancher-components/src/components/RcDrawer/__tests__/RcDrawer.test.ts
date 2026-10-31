import { h } from 'vue';
import type { VNode } from 'vue';
import { mount } from '@vue/test-utils';
import RcDrawer from '../RcDrawer.vue';
import RcDrawerCard from '../RcDrawerCard.vue';

type MountOptions = {
  slots?: Record<string, string | ((props: { close: () => void }) => VNode)>;
  attrs?: Record<string, string>;
};

const mountDrawer = ({ slots = {}, attrs = {} }: MountOptions = {}) => mount(RcDrawer, {
  props: { title: 'my-config (ConfigMap)' },
  slots,
  attrs,
});

const withFooter = { footer: '<button data-testid="extra">Edit Config</button>' };

describe('component: RcDrawer', () => {
  it('should be a modal dialog named by its title', () => {
    const wrapper = mountDrawer();

    expect(wrapper.attributes('role')).toBe('dialog');
    expect(wrapper.attributes('aria-modal')).toBe('true');
    expect(wrapper.attributes('aria-label')).toBe('my-config (ConfigMap)');
  });

  it('should show the title in the header', () => {
    const wrapper = mountDrawer();

    expect(wrapper.find('[data-testid="rc-drawer-title"]').text()).toBe('my-config (ConfigMap)');
  });

  it('should make the title a level 2 heading', () => {
    const title = mountDrawer().find('[data-testid="rc-drawer-title"]');

    expect(title.attributes('role')).toBe('heading');
    expect(title.attributes('aria-level')).toBe('2');
  });

  it('should render the header slot in place of the standard header', () => {
    const wrapper = mountDrawer({ slots: { header: '<span data-testid="custom-header">Custom</span>' } });

    expect(wrapper.find('[data-testid="rc-drawer-header"] [data-testid="custom-header"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="rc-drawer-title"]').exists()).toBe(false);
  });

  it('should give the header slot a close function that closes the drawer', async() => {
    const wrapper = mountDrawer({ slots: { header: ({ close }: { close: () => void }) => h('button', { 'data-testid': 'back', onClick: close }, 'Back') } });

    await wrapper.find('[data-testid="back"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should render the default slot in the body', () => {
    const wrapper = mountDrawer({ slots: { default: '<p data-testid="content">Content</p>' } });

    expect(wrapper.find('[data-testid="rc-drawer-body"] [data-testid="content"]').exists()).toBe(true);
  });

  it('should name the close button after the drawer', () => {
    const wrapper = mountDrawer();

    expect(wrapper.find('[data-testid="rc-drawer-close"]').attributes('aria-label')).toBe('component.drawer.chrome.ariaLabel.close-{"target":"my-config (ConfigMap)"}');
  });

  it('should emit close from the header close button', async() => {
    const wrapper = mountDrawer();

    await wrapper.find('[data-testid="rc-drawer-close"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should render the footer slot in the footer', () => {
    const wrapper = mountDrawer({ slots: withFooter });

    expect(wrapper.find('[data-testid="rc-drawer-footer"] [data-testid="extra"]').exists()).toBe(true);
  });

  it('should give the footer slot a close function that closes the drawer', async() => {
    const wrapper = mountDrawer({ slots: { footer: ({ close }: { close: () => void }) => h('button', { 'data-testid': 'cancel', onClick: close }, 'Cancel') } });

    await wrapper.find('[data-testid="cancel"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it.each([
    ['there is no footer', {}],
    ['the footer renders nothing', { footer: '<button v-if="false">Save</button>' }],
    ['the footer renders an empty list', { footer: '<button v-for="n in 0" :key="n">Save</button>' }],
    ['the footer renders only whitespace', { footer: ' ' }],
  ])('should leave the footer out when %s', (_label, slots) => {
    const wrapper = mountDrawer({ slots });

    expect(wrapper.find('[data-testid="rc-drawer-footer"]').exists()).toBe(false);
  });

  it('should pass attributes to the dialog element', () => {
    const wrapper = mountDrawer({ attrs: { 'data-testid': 'my-drawer', class: 'extra' } });

    expect(wrapper.attributes('data-testid')).toBe('my-drawer');
    expect(wrapper.classes()).toContain('extra');
  });
});

describe('component: RcDrawerCard', () => {
  it('should render its content', () => {
    const wrapper = mount(RcDrawerCard, { slots: { default: '<p data-testid="content">Content</p>' } });

    expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
  });
});
