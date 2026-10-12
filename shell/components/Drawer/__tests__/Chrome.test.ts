import { mount } from '@vue/test-utils';
import Chrome from '@shell/components/Drawer/Chrome.vue';

const createWrapper = (props = {}, slots = {}) => mount(Chrome, {
  props: { ariaTarget: 'My Drawer', ...props },
  slots: {
    title: 'Title', body: '<p data-testid="content">Content</p>', ...slots
  },
  global: { provide: { store: {} } },
});

describe('component: Drawer/Chrome', () => {
  it('should be a modal dialog named after its target', () => {
    const wrapper = createWrapper();

    expect(wrapper.attributes('role')).toBe('dialog');
    expect(wrapper.attributes('aria-modal')).toBe('true');
    expect(wrapper.attributes('aria-label')).toBe('My Drawer');
  });

  it('should render the title and body slots', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.header .title').text()).toBe('Title');
    expect(wrapper.find('.body [data-testid="content"]').exists()).toBe(true);
  });

  it('should name the header close button after its target', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="slide-in-close"]').attributes('aria-label')).toBe('component.drawer.chrome.ariaLabel.close-{"target":"My Drawer"}');
  });

  it('should emit close from the header close button', async() => {
    const wrapper = createWrapper();

    await wrapper.find('[data-testid="slide-in-close"]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should emit close from the footer close button', async() => {
    const wrapper = createWrapper();

    await wrapper.find('.footer button').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should render additional actions after the footer close button', () => {
    const wrapper = createWrapper({}, { 'additional-actions': '<button data-testid="extra">Save</button>' });
    const buttons = wrapper.findAll('.footer button');

    expect(buttons).toHaveLength(2);
    expect(buttons[1].attributes('data-testid')).toBe('extra');
  });

  it('should not render a footer when removeFooter is set', () => {
    const wrapper = createWrapper({ removeFooter: true });

    expect(wrapper.find('.footer').exists()).toBe(false);
  });
});
