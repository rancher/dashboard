import { mount, RouterLinkStub } from '@vue/test-utils';
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

  describe('space key navigation', () => {
    it('triggers click when Space is pressed on a link button', async() => {
      const to = { name: 'some-route' };
      const wrapper = mount(RcButton, {
        props:  { to },
        global: { stubs: { RouterLink: RouterLinkStub } },
      });

      const link = wrapper.findComponent(RouterLinkStub);
      const clickSpy = jest.spyOn(link.element, 'click');

      await link.trigger('keydown', { key: ' ' });

      expect(clickSpy).toHaveBeenCalledWith();
    });

    it('triggers click when Space is pressed on a regular button', async() => {
      const wrapper = mount(RcButton);
      const button = wrapper.find('button');
      const clickSpy = jest.spyOn(button.element, 'click');

      await button.trigger('keydown', { key: ' ' });

      expect(clickSpy).toHaveBeenCalledWith();
    });
  });

  describe('to and href mutual exclusion', () => {
    it('warns when both "to" and "href" props are provided', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mount(RcButton, {
        props:  { to: '/foo', href: 'https://example.com' },
        global: { stubs: { RouterLink: RouterLinkStub } },
      });

      expect(warnSpy).toHaveBeenCalledWith('[RcButton] "to" and "href" are mutually exclusive. Provide only one.');
      warnSpy.mockRestore();
    });

    it('does not warn when only "to" is provided', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mount(RcButton, {
        props:  { to: '/foo' },
        global: { stubs: { RouterLink: RouterLinkStub } },
      });

      expect(warnSpy).not.toHaveBeenCalledWith('[RcButton] "to" and "href" are mutually exclusive. Provide only one.');
      warnSpy.mockRestore();
    });

    it('does not warn when only "href" is provided', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mount(RcButton, { props: { href: 'https://example.com' } });

      expect(warnSpy).not.toHaveBeenCalledWith('[RcButton] "to" and "href" are mutually exclusive. Provide only one.');
      warnSpy.mockRestore();
    });
  });

  describe('href prop', () => {
    it('renders as an <a> element when "href" prop is provided', () => {
      const wrapper = mount(RcButton, { props: { href: 'https://example.com' } });

      expect(wrapper.find('a').exists()).toBe(true);
      expect(wrapper.find('button').exists()).toBe(false);
    });

    it('sets the href attribute on the rendered anchor', () => {
      const href = 'https://example.com';
      const wrapper = mount(RcButton, { props: { href } });

      expect(wrapper.find('a').attributes('href')).toStrictEqual(href);
    });

    it('sets role="link" when rendered as an anchor', () => {
      const wrapper = mount(RcButton, { props: { href: 'https://example.com' } });

      expect(wrapper.find('a').attributes('role')).toStrictEqual('link');
    });

    it('applies button classes when rendered as an anchor', () => {
      const wrapper = mount(RcButton, { props: { href: 'https://example.com', variant: 'secondary' } });
      const anchor = wrapper.find('a');

      expect(anchor.classes()).toContain('rc-button');
      expect(anchor.classes()).toContain('btn');
      expect(anchor.classes()).toContain('variant-secondary');
    });

    it('triggers click when Space is pressed on an anchor', async() => {
      const wrapper = mount(RcButton, { props: { href: 'https://example.com' } });
      const anchor = wrapper.find('a');
      const clickSpy = jest.spyOn(anchor.element, 'click');

      await anchor.trigger('keydown', { key: ' ' });

      expect(clickSpy).toHaveBeenCalledWith();
    });
  });

  describe('to prop', () => {
    it('renders as a <button> when no "to" prop is provided', () => {
      const wrapper = mount(RcButton);

      expect(wrapper.find('button').exists()).toBe(true);
      expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
    });

    it('renders as a RouterLink when "to" prop is provided', () => {
      const to = { name: 'some-route' };
      const wrapper = mount(RcButton, {
        props:  { to },
        global: { stubs: { RouterLink: RouterLinkStub } },
      });

      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.exists()).toBe(true);
      expect(wrapper.find('button').exists()).toBe(false);
      expect(link.props('to')).toStrictEqual(to);
    });

    it('applies button classes when rendered as a RouterLink', () => {
      const wrapper = mount(RcButton, {
        props:  { to: '/foo', variant: 'secondary' },
        global: { stubs: { RouterLink: RouterLinkStub } },
      });

      const link = wrapper.findComponent(RouterLinkStub);

      expect(link.classes()).toContain('rc-button');
      expect(link.classes()).toContain('btn');
      expect(link.classes()).toContain('variant-secondary');
    });
  });
});
