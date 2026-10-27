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

const withAction = { 'additional-actions': '<button data-testid="extra">Edit Config</button>' };

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

  it('should render header actions between the title and the close button, outside the heading', () => {
    const wrapper = mountDrawer({ slots: { 'header-actions': '<button data-testid="expand">Expand</button>' } });
    const header = Array.from(wrapper.find('.header').element.children).map((el) => el.getAttribute('data-testid'));

    expect(header).toStrictEqual(['rc-drawer-title', 'expand', 'rc-drawer-close']);
  });

  it('should show the title slot in place of the title', () => {
    const wrapper = mountDrawer({ slots: { title: '<span data-testid="custom-title">Custom</span>' } });

    expect(wrapper.find('[data-testid="rc-drawer-title"]').text()).toBe('Custom');
    expect(wrapper.find('[data-testid="custom-title"]').exists()).toBe(true);
  });

  it('should keep the title prop as its name when the title slot is used', () => {
    const wrapper = mountDrawer({ slots: { title: '<a href="#">my-config</a>' } });

    expect(wrapper.attributes('aria-label')).toBe('my-config (ConfigMap)');
  });

  it('should render the default slot in the body', () => {
    const wrapper = mountDrawer({ slots: { default: '<p data-testid="content">Content</p>' } });

    expect(wrapper.find('[data-testid="rc-drawer-body"] [data-testid="content"]').exists()).toBe(true);
  });

  it('should name both close buttons after the drawer', () => {
    const wrapper = mountDrawer({ slots: withAction });
    const label = 'component.drawer.chrome.ariaLabel.close-{"target":"my-config (ConfigMap)"}';

    expect(wrapper.find('[data-testid="rc-drawer-close"]').attributes('aria-label')).toBe(label);
    expect(wrapper.find('[data-testid="rc-drawer-footer"] button').attributes('aria-label')).toBe(label);
  });

  it('should label the footer button Close', () => {
    const wrapper = mountDrawer({ slots: withAction });

    expect(wrapper.find('[data-testid="rc-drawer-footer"] button').text()).toBe('%component.drawer.chrome.close%');
  });

  it('should render the close slot in place of the footer Close button', () => {
    const wrapper = mountDrawer({ slots: { close: '<button data-testid="cancel">Cancel</button>', ...withAction } });
    const buttons = wrapper.findAll('[data-testid="rc-drawer-footer"] button');

    expect(buttons.map((b) => b.attributes('data-testid'))).toStrictEqual(['cancel', 'extra']);
  });

  it('should give the close slot a close function that closes the drawer', async() => {
    const wrapper = mountDrawer({
      slots: {
        close: ({ close }: { close: () => void }) => h('button', { 'data-testid': 'cancel', onClick: close }, 'Cancel'),
        ...withAction
      }
    });

    await wrapper.find('[data-testid="cancel"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should keep the header close button when the close slot is used', () => {
    const wrapper = mountDrawer({ slots: { close: '<button>Cancel</button>', ...withAction } });

    expect(wrapper.find('[data-testid="rc-drawer-close"]').attributes('aria-label')).toBe('component.drawer.chrome.ariaLabel.close-{"target":"my-config (ConfigMap)"}');
  });

  it('should emit close from the header close button', async() => {
    const wrapper = mountDrawer();

    await wrapper.find('[data-testid="rc-drawer-close"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should emit close from the footer close button', async() => {
    const wrapper = mountDrawer({ slots: withAction });

    await wrapper.find('[data-testid="rc-drawer-footer"] button').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it.each([
    ['there are no additional actions', {}],
    ['the additional actions render nothing', { 'additional-actions': '<button v-if="false">Save</button>' }],
    ['the only button would be a replaced close', { close: '<button>Cancel</button>' }],
  ])('should leave the footer out when %s', (_label, slots) => {
    const wrapper = mountDrawer({ slots });

    expect(wrapper.find('[data-testid="rc-drawer-footer"]').exists()).toBe(false);
  });

  it('should render additional actions after the footer close button', () => {
    const wrapper = mountDrawer({ slots: withAction });
    const buttons = wrapper.findAll('[data-testid="rc-drawer-footer"] button');

    expect(buttons).toHaveLength(2);
    expect(buttons[1].attributes('data-testid')).toBe('extra');
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
