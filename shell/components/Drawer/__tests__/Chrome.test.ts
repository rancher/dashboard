import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import Chrome from '@shell/components/Drawer/Chrome.vue';

type MountOptions = {
  props?: Record<string, unknown>;
  slots?: Record<string, string>;
};

const mountChrome = ({ props = {}, slots = {} }: MountOptions = {}) => mount(Chrome, {
  props: { ariaTarget: 'my-policy', ...props },
  slots,
});

const footerButtons = (wrapper: ReturnType<typeof mountChrome>) => wrapper.findAll('[data-testid="rc-drawer-footer"] button').map((b) => b.text());

describe('component: Chrome', () => {
  it('should render as a drawer named by ariaTarget', async() => {
    const wrapper = mountChrome();

    await nextTick();

    expect(wrapper.attributes('role')).toBe('dialog');
    expect(wrapper.attributes('aria-label')).toBe('my-policy');
  });

  it('should show ariaTarget as the title when there is no title slot', () => {
    const wrapper = mountChrome();

    expect(wrapper.find('[data-testid="rc-drawer-title"]').text()).toBe('my-policy');
  });

  it('should show the title slot in the header', () => {
    const wrapper = mountChrome({ slots: { title: '<span data-testid="policy-title">Policy</span>' } });

    expect(wrapper.find('[data-testid="rc-drawer-title"] [data-testid="policy-title"]').exists()).toBe(true);
  });

  it('should render the body slot in the drawer body', () => {
    const wrapper = mountChrome({ slots: { body: '<p data-testid="policy-body">Body</p>' } });

    expect(wrapper.find('[data-testid="rc-drawer-body"] [data-testid="policy-body"]').exists()).toBe(true);
  });

  it('should show a footer with Close followed by the additional actions', () => {
    const wrapper = mountChrome({ slots: { 'additional-actions': '<button>Save</button>' } });

    expect(footerButtons(wrapper)).toStrictEqual(['%component.drawer.chrome.close%', 'Save']);
  });

  it('should show a footer with only Close when there are no additional actions', () => {
    const wrapper = mountChrome();

    expect(footerButtons(wrapper)).toStrictEqual(['%component.drawer.chrome.close%']);
  });

  it('should label the footer close button with closeLabel', () => {
    const wrapper = mountChrome({ props: { closeLabel: 'Cancel' } });

    expect(footerButtons(wrapper)).toStrictEqual(['Cancel']);
  });

  it('should leave the footer out with removeFooter', () => {
    const wrapper = mountChrome({ props: { removeFooter: true }, slots: { 'additional-actions': '<button>Save</button>' } });

    expect(wrapper.find('[data-testid="rc-drawer-footer"]').exists()).toBe(false);
  });

  it('should render the header slot in place of the whole header', () => {
    const wrapper = mountChrome({ slots: { header: '<span data-testid="custom-header">Custom</span>' } });

    expect(wrapper.find('[data-testid="rc-drawer-header"] [data-testid="custom-header"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="rc-drawer-close"]').exists()).toBe(false);
  });

  it('should render the footer slot in place of the whole footer', () => {
    const wrapper = mountChrome({ slots: { footer: '<button>Done</button>' } });

    expect(footerButtons(wrapper)).toStrictEqual(['Done']);
  });

  it.each([
    ['the header close button', '[data-testid="rc-drawer-close"]'],
    ['the footer close button', '[data-testid="rc-drawer-footer-secondary"]'],
  ])('should emit close from %s', async(_label, selector) => {
    const wrapper = mountChrome();

    await wrapper.find(selector).trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
