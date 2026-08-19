import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { RC_DRAWER_CLOSE } from './composables';
import RcDrawer from './RcDrawer.vue';
import type { RcDrawerProps } from './types';

interface MountOptions {
  props?: Partial<RcDrawerProps>;
  slots?: Record<string, string>;
}

const store = { getters: { 'i18n/t': (key: string) => key } };

// RcButton is deliberately NOT stubbed: the close controls are found by
// `data-testid` from outside this component (SlideInPanelManager resolves the
// focus trap's initial focus that way), so attribute fallthrough through the
// real RcButton is part of what these tests need to protect.
const mountDrawer = (options: MountOptions = {}) => mount(RcDrawer, {
  props:  { title: 'My Resource', ...(options.props || {}) },
  slots:  options.slots,
  global: {
    provide: { store },
    mocks:   { $store: store },
  },
});

describe('component: RcDrawer', () => {
  it('should render the title in the header', () => {
    const wrapper = mountDrawer();

    expect(wrapper.find('.rc-drawer__title').text()).toContain('My Resource');
  });

  it('should render the title slot over the title prop', () => {
    const wrapper = mountDrawer({ slots: { title: '<span class="custom">Custom title</span>' } });

    expect(wrapper.find('.rc-drawer__title .custom').exists()).toBe(true);
    expect(wrapper.find('.rc-drawer__title').text()).not.toContain('My Resource');
  });

  it('should render the body slot', () => {
    const wrapper = mountDrawer({ slots: { body: '<p class="content">Body content</p>' } });

    expect(wrapper.find('.rc-drawer__body .content').text()).toBe('Body content');
  });

  it('should render a footer by default', () => {
    const wrapper = mountDrawer();

    expect(wrapper.find('.rc-drawer__footer').exists()).toBe(true);
  });

  it('should not render the footer when hideFooter is set', () => {
    const wrapper = mountDrawer({ props: { hideFooter: true } });

    expect(wrapper.find('.rc-drawer__footer').exists()).toBe(false);
  });

  it('should replace the whole header with the header slot', () => {
    const wrapper = mountDrawer({ slots: { header: '<div class="own-header">Mine</div>' } });

    expect(wrapper.find('.own-header').exists()).toBe(true);
    expect(wrapper.find('[data-testid="rc-drawer-close"]').exists()).toBe(false);
  });

  it('should replace the whole footer with the footer slot', () => {
    const wrapper = mountDrawer({ slots: { footer: '<div class="own-footer">Mine</div>' } });

    expect(wrapper.find('.own-footer').exists()).toBe(true);
    expect(wrapper.find('[data-testid="rc-drawer-close-button"]').exists()).toBe(false);
  });

  it.each([
    ['rc-drawer-close'],
    ['rc-drawer-close-button'],
  ])('should emit close when %s is clicked', async(testid) => {
    const wrapper = mountDrawer();

    await wrapper.find(`[data-testid="${ testid }"]`).trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  describe('actions', () => {
    const action = {
      label: 'Edit Config', action: jest.fn(), testid: 'edit'
    };

    it('should render a footer button per action, after the built-in Close', () => {
      const wrapper = mountDrawer({ props: { actions: [action] } });
      const labels = wrapper.findAll('.rc-drawer__footer-actions button').map((b) => b.text());

      expect(labels).toStrictEqual(['component.drawer.close', 'Edit Config']);
    });

    it('should invoke the action when its button is clicked', async() => {
      const spy = jest.fn();
      const wrapper = mountDrawer({ props: { actions: [{ ...action, action: spy }] } });

      await wrapper.find('[data-testid="edit"]').trigger('click');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should default an action to the primary variant', () => {
      const wrapper = mountDrawer({ props: { actions: [action] } });

      expect(wrapper.find('[data-testid="edit"]').classes()).toContain('variant-primary');
    });

    it('should honour an explicit variant', () => {
      const wrapper = mountDrawer({ props: { actions: [{ ...action, variant: 'secondary' as const }] } });

      expect(wrapper.find('[data-testid="edit"]').classes()).toContain('variant-secondary');
    });

    it('should render no extra buttons when there are no actions', () => {
      const wrapper = mountDrawer();

      expect(wrapper.findAll('.rc-drawer__footer-actions button')).toHaveLength(1);
    });
  });

  describe('loading', () => {
    it('should show a spinner in place of the body', () => {
      const wrapper = mountDrawer({ props: { loading: true }, slots: { body: '<p class="content">Body</p>' } });

      expect(wrapper.find('[data-testid="rc-drawer-loading"]').exists()).toBe(true);
      expect(wrapper.find('.content').exists()).toBe(false);
    });

    it('should show the body once loading is done', () => {
      const wrapper = mountDrawer({ slots: { body: '<p class="content">Body</p>' } });

      expect(wrapper.find('[data-testid="rc-drawer-loading"]').exists()).toBe(false);
      expect(wrapper.find('.content').exists()).toBe(true);
    });
  });

  describe('provided closer', () => {
    // Closing is provided by whatever shows the drawer, so it survives however
    // the panel in between is written - which props it declares, which events,
    // and whether RcDrawer is its root.
    const nestedPanel = () => defineComponent({
      name:  'Panel',
      props: { onClose: { type: Function, default: undefined } },
      setup: () => () => h('div', [h(RcDrawer, { title: 'X' })]),
    });

    const mountProvided = (close: () => void) => mount(nestedPanel(), {
      global: {
        provide: { store, [RC_DRAWER_CLOSE as symbol]: close },
        mocks:   { $store: store },
      },
    });

    it.each([
      ['rc-drawer-close'],
      ['rc-drawer-close-button'],
    ])('should close from %s even when the panel declares an onClose prop and is not the root', async(testid) => {
      const close = jest.fn();
      const wrapper = mountProvided(close);

      await wrapper.find(`[data-testid="${ testid }"]`).trigger('click');

      expect(close).toHaveBeenCalledTimes(1);
    });

    it('should still emit close so a consumer can react', async() => {
      const wrapper = mountDrawer();

      await wrapper.find('[data-testid="rc-drawer-close"]').trigger('click');

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('accessibility', () => {
    it('should expose the drawer as a modal dialog named by its title', () => {
      const wrapper = mountDrawer();
      const drawer = wrapper.find('.rc-drawer');

      expect(drawer.attributes('role')).toBe('dialog');
      expect(drawer.attributes('aria-modal')).toBe('true');
      expect(drawer.attributes('aria-label')).toBe('My Resource');
    });

    it('should not claim modality when modal is false', () => {
      const wrapper = mountDrawer({ props: { modal: false } });

      expect(wrapper.find('.rc-drawer').attributes('aria-modal')).toBe('false');
    });

    it('should keep the title prop as the name even when the title slot is used', () => {
      // Otherwise a drawer whose title slot holds navigation announces itself
      // as wherever the user has navigated to.
      const wrapper = mountDrawer({ slots: { title: '<span>Something else entirely</span>' } });

      expect(wrapper.find('.rc-drawer').attributes('aria-label')).toBe('My Resource');
    });

    it('should keep the name when the header slot replaces the header', () => {
      const wrapper = mountDrawer({ slots: { header: '<div class="own-header">Mine</div>' } });

      expect(wrapper.find('.rc-drawer').attributes('aria-label')).toBe('My Resource');
    });

    it('should render the title as a heading', () => {
      const wrapper = mountDrawer();

      expect(wrapper.find('h2.rc-drawer__title').exists()).toBe(true);
    });

    it('should name the header close control after the drawer', () => {
      const wrapper = mountDrawer();
      const label = wrapper.find('[data-testid="rc-drawer-close"]').attributes('aria-label');

      expect(label).toContain('component.drawer.ariaLabel.close');
      expect(label).toContain('My Resource');
    });

    it('should leave the footer close button to its visible label', () => {
      const wrapper = mountDrawer();
      const footerClose = wrapper.find('[data-testid="rc-drawer-close-button"]');

      // Two controls sharing one aria-label are indistinguishable to a screen
      // reader, so the footer button keeps its visible text as its name.
      expect(footerClose.attributes('aria-label')).toBeUndefined();
      expect(footerClose.text()).toBe('component.drawer.close');
    });
  });

  describe('scrollToTop', () => {
    it('should scroll the body, which is the drawer scroll container', () => {
      const wrapper = mountDrawer();
      const body = wrapper.find('.rc-drawer__body').element;

      body.scrollTo = jest.fn();

      (wrapper.vm as unknown as { scrollToTop: () => void }).scrollToTop();

      expect(body.scrollTo).toHaveBeenCalledWith({ top: 0 });
    });
  });
});
