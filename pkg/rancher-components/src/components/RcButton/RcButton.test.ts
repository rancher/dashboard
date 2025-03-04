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

  it('applies correct size class', () => {
    const wrapper = mount(RcButton, { props: { small: true } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('btn-sm');
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
