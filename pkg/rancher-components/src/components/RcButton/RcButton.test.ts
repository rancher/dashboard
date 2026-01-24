import { mount } from '@vue/test-utils';
import RcButton from './RcButton.vue';

describe('rcButton.vue', () => {
  it('renders with default variant', () => {
    const wrapper = mount(RcButton);
    const button = wrapper.find('button');

    expect(button.classes()).toContain('btn');
    expect(button.classes()).toContain('variant-primary');
  });

  it('applies correct variant', () => {
    const wrapper = mount(RcButton, { props: { primary: true } });
    const button = wrapper.find('button');

    expect(button.classes()).toContain('variant-primary');
  });

  it('defaults to primary variant if multiple variants are provided', () => {
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

    expect(button.classes()).toContain('variant-primary');
  });

  it('defaults to secondary variant if both secondary and tertiary variants are provided', () => {
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

    expect(button.classes()).toContain('variant-secondary');
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

    expect(button.classes()).toContain('variant-ghost');
  });

  describe('variant prop', () => {
    it('applies variant-primary class when variant="primary"', () => {
      const wrapper = mount(RcButton, { props: { variant: 'primary' } });
      const button = wrapper.find('button');

      expect(button.classes()).toContain('variant-primary');
    });

    it('applies variant-secondary class when variant="secondary"', () => {
      const wrapper = mount(RcButton, { props: { variant: 'secondary' } });
      const button = wrapper.find('button');

      expect(button.classes()).toContain('variant-secondary');
    });

    it('applies variant-tertiary class when variant="tertiary"', () => {
      const wrapper = mount(RcButton, { props: { variant: 'tertiary' } });
      const button = wrapper.find('button');

      expect(button.classes()).toContain('variant-tertiary');
    });

    it('applies variant-link class when variant="link"', () => {
      const wrapper = mount(RcButton, { props: { variant: 'link' } });
      const button = wrapper.find('button');

      expect(button.classes()).toContain('variant-link');
    });

    it('applies variant-multi-action class when variant="multiAction"', () => {
      const wrapper = mount(RcButton, { props: { variant: 'multiAction' } });
      const button = wrapper.find('button');

      expect(button.classes()).toContain('variant-multi-action');
    });

    it('applies variant-ghost class when variant="ghost"', () => {
      const wrapper = mount(RcButton, { props: { variant: 'ghost' } });
      const button = wrapper.find('button');

      expect(button.classes()).toContain('variant-ghost');
    });
  });
});
