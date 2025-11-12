import { mount } from '@vue/test-utils';
import RcDropdownButton from './RcDropdownButton.vue';
import { RcButton } from '@components/RcButton';

describe('rcDropdownButton.vue', () => {
  it('renders with default role', () => {
    const wrapper = mount(RcDropdownButton, {
      props: {
        options: [
          { label: 'Option 1' },
          { label: 'Option 2' }
        ]
      }
    });

    expect(wrapper.find('.rc-dropdown-button').exists()).toBe(true);
  });

  it('renders primary role correctly', () => {
    const wrapper = mount(RcDropdownButton, {
      props: {
        role:    'primary',
        options: [{ label: 'Option 1' }]
      }
    });

    const buttons = wrapper.findAllComponents(RcButton);

    expect(buttons).toHaveLength(2);
    expect(buttons[0].props('role')).toBe('primary');
    expect(buttons[1].props('role')).toBe('primary');
  });

  it('renders secondary role correctly', () => {
    const wrapper = mount(RcDropdownButton, {
      props: {
        role:    'secondary',
        options: [{ label: 'Option 1' }]
      }
    });

    const buttons = wrapper.findAllComponents(RcButton);

    expect(buttons[0].props('role')).toBe('secondary');
    expect(buttons[1].props('role')).toBe('secondary');
  });

  it('applies correct size to both buttons', () => {
    const wrapper = mount(RcDropdownButton, {
      props: {
        size:    'small',
        options: [{ label: 'Option 1' }]
      }
    });

    const buttons = wrapper.findAllComponents(RcButton);

    expect(buttons[0].props('size')).toBe('small');
    expect(buttons[1].props('size')).toBe('small');
  });

  it('emits click event when primary button is clicked', async() => {
    const wrapper = mount(RcDropdownButton, { props: { options: [{ label: 'Option 1' }] } });

    const primaryButton = wrapper.find('.primary-button');

    await primaryButton.trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')?.[0]).toBeDefined();
  });

  it('renders dropdown options correctly', () => {
    const options = [
      { label: 'Option 1', icon: 'icon-edit' },
      { label: 'Option 2', icon: 'icon-delete' },
      { divider: true },
      { label: 'Option 3' }
    ];

    const wrapper = mount(RcDropdownButton, { props: { options } });

    expect(wrapper.html()).toContain('Option 1');
    expect(wrapper.html()).toContain('Option 2');
    expect(wrapper.html()).toContain('Option 3');
  });

  it('renders slot content correctly', () => {
    const wrapper = mount(RcDropdownButton, {
      props: { options: [{ label: 'Option 1' }] },
      slots: { default: 'Primary Action' }
    });

    expect(wrapper.text()).toContain('Primary Action');
  });

  it('applies disabled state to both buttons', () => {
    const wrapper = mount(RcDropdownButton, {
      props: {
        disabled: true,
        options:  [{ label: 'Option 1' }]
      }
    });

    const buttons = wrapper.findAllComponents(RcButton);

    expect(buttons[0].props('disabled')).toBe(true);
    expect(buttons[1].props('disabled')).toBe(true);
  });

  it('passes leftIcon to primary button', () => {
    const wrapper = mount(RcDropdownButton, {
      props: {
        leftIcon: 'icon-add',
        options:  [{ label: 'Option 1' }]
      }
    });

    const primaryButton = wrapper.findComponent({ name: 'RcButton' });

    expect(primaryButton.props('leftIcon')).toBe('icon-add');
  });

  it('shows "No actions available" when options array is empty', () => {
    const wrapper = mount(RcDropdownButton, { props: { options: [] } });

    expect(wrapper.text()).toContain('No actions available');
  });
});
