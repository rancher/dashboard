import { mount } from '@vue/test-utils';
import RcButton from './RcButton.vue';

describe('rcButton.vue', () => {
  it('renders with default role', () => {
    const wrapper = mount(RcButton);
    const button = wrapper.find('button');

    expect(button.classes()).toContain('btn');
    expect(button.classes()).toContain('role-primary');
  });

  it('applies correct role', () => {
    const wrapper = mount(RcButton, { props: { primary: true } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('role-primary');
  });

  it('defaults to primary role if multiple roles are provided', () => {
    const wrapper = mount(
      RcButton,
      {
        props: {
          primary:   true,
          secondary: true,
          tertiary:  true,
        }
      }
    );
    const button = wrapper.find('button');

    expect(button.classes()).toContain('role-primary');
  });

  it('defaults to secondary role if both secondary and tertiary roles are provided', () => {
    const wrapper = mount(
      RcButton,
      {
        props: {
          secondary: true,
          tertiary:  true,
        }
      }
    );
    const button = wrapper.find('button');

    expect(button.classes()).toContain('role-secondary');
  });

  it('applies correct size class using deprecated small prop', () => {
    const wrapper = mount(RcButton, { props: { small: true } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('btn-sm');
  });

  it('applies small size class using new size prop', () => {
    const wrapper = mount(RcButton, { props: { size: 'small' } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('btn-small');
  });

  it('applies medium size class using new size prop', () => {
    const wrapper = mount(RcButton, { props: { size: 'medium' } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('btn-medium');
  });

  it('applies large size class using new size prop', () => {
    const wrapper = mount(RcButton, { props: { size: 'large' } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('btn-large');
  });

  it('emits deprecation warning for small prop', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mount(RcButton, { props: { small: true } });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[RcButton] The "small" prop is deprecated and will be removed in a future version. Please use size="small" instead.'
    );
    consoleWarnSpy.mockRestore();
  });

  it('does not emit deprecation warning when using new size prop', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mount(RcButton, { props: { size: 'small' } });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('renders slots correctly', () => {
    const wrapper = mount(RcButton, {
      slots: {
        default: 'Click Me',
        before:  'Before',
        after:   'After',
      },
    });

    expect(wrapper.text()).toContain('Before');
    expect(wrapper.text()).toContain('Click Me');
    expect(wrapper.text()).toContain('After');
  });

  it('focuses the button when focus method is called', async() => {
    const wrapper = mount(
      RcButton,
      { attachTo: document.body }
    );

    await wrapper.vm.focus();
    const button = wrapper.find('button');

    expect(button.element).toBe(document.activeElement);
  });

  it('applies additional classes from $attrs', () => {
    const wrapper = mount(RcButton, { attrs: { class: 'extra-class' } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('extra-class');
  });

  it('applies ghost button styles correctly', () => {
    const wrapper = mount(RcButton, { props: { ghost: true } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('role-ghost');
  });
});
