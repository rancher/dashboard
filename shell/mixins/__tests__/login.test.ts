import { shallowMount } from '@vue/test-utils';
import Login from '@shell/mixins/login';

const Host = {
  mixins:   [Login],
  template: '<button ref="btn" />',
};

const mountHost = (props: { name: string, type: string, focusOnMount?: boolean }) => shallowMount(Host, {
  props:  { focusOnMount: false, ...props },
  // The mixin reads `t` off the component, which the i18n plugin provides.
  global: { mocks: { t: (key: string) => key } },
});

describe('mixin: login', () => {
  describe('displayName', () => {
    it('should label a config named after its provider with the vendor name', () => {
      const wrapper = mountHost({ name: 'github', type: 'githubProvider' });

      expect(wrapper.vm.displayName).toBe('model.authConfig.provider.github');
    });

    // The public provider list spells a provider `githubProvider` where the
    // config spells it `github`, so the two have to be compared on the key.
    it('should match the name against the normalised provider', () => {
      const wrapper = mountHost({ name: 'keycloakoidc', type: 'keyCloakOIDCProvider' });

      expect(wrapper.vm.displayName).toBe('model.authConfig.provider.keycloakoidc');
    });

    it('should ignore the case of the config name', () => {
      const wrapper = mountHost({ name: 'GitHub', type: 'githubProvider' });

      expect(wrapper.vm.displayName).toBe('model.authConfig.provider.github');
    });

    // Otherwise every GitHub config would sign you in as "GitHub", with nothing
    // on the button saying which of them it is.
    it('should label a config the admin named with that name', () => {
      const wrapper = mountHost({ name: 'gh-community', type: 'githubProvider' });

      expect(wrapper.vm.displayName).toBe('gh-community');
    });

    // `t` yields undefined rather than the key, so the button would otherwise
    // read "Log in with undefined" for a provider nothing is translated for.
    it('should fall back to the provider key when there is no translation', () => {
      const wrapper = shallowMount(Host, {
        props:  { focusOnMount: false, name: 'oidc', type: 'oidcProvider' },
        global: { mocks: { t: () => undefined } },
      });

      expect(wrapper.vm.displayName).toBe('oidc');
    });
  });

  describe('focus', () => {
    it('should focus the control on mount when asked to', () => {
      const wrapper = shallowMount(Host, {
        props: {
          focusOnMount: true, name: 'github', type: 'githubProvider'
        },
        global:   { mocks: { t: (key: string) => key } },
        // `document.activeElement` only follows a focus call for an element that
        // is in the document.
        attachTo: document.body,
      });

      expect(document.activeElement).toBe(wrapper.vm.$refs.btn);

      wrapper.unmount();
    });

    // SAML renders no control at all while it is rejecting a CLI login.
    it('should not throw when there is no control to focus', () => {
      const Empty = { mixins: [Login], template: '<div />' };
      const wrapper = shallowMount(Empty, {
        props: {
          focusOnMount: false, name: 'github', type: 'githubProvider'
        },
        global: { mocks: { t: (key: string) => key } },
      });

      expect(() => (wrapper.vm as any).focus()).not.toThrow();
    });
  });
});
