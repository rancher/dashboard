import { defineComponent, h, ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import { loginDisplayName, useLogin } from '@shell/composables/useLogin';

jest.mock('vuex', () => ({ useStore: () => ({}) }));

describe('composable: useLogin', () => {
  describe('loginDisplayName', () => {
    const t = (key: string) => key;

    it.each([
      ['a config named after its provider', 'github', 'githubProvider', 'model.authConfig.provider.github'],
      ['a config whose provider type spells the key differently', 'keycloakoidc', 'keyCloakOIDCProvider', 'model.authConfig.provider.keycloakoidc'],
      ['a config named after its provider in another case', 'GitHub', 'githubProvider', 'model.authConfig.provider.github'],
      ['a config the admin named', 'gh-community', 'githubProvider', 'gh-community'],
    ])('should label %s', (_, name, type, expected) => {
      expect(loginDisplayName(t, name, type)).toStrictEqual(expected);
    });

    it('should fall back to the provider key when there is no translation', () => {
      expect(loginDisplayName(() => undefined, 'oidc', 'oidcProvider')).toStrictEqual('oidc');
    });
  });

  describe('useLogin', () => {
    const mountHost = (focusOnMount: boolean, withTarget = true) => {
      const focus = jest.fn();
      const exposed: { displayName?: string } = {};

      const Host = defineComponent({
        setup() {
          const target = ref(withTarget ? { focus } : null);
          const { displayName } = useLogin({
            focusOnMount, name: 'github', type: 'githubProvider'
          }, target);

          exposed.displayName = displayName.value;

          return () => h('div');
        }
      });

      shallowMount(Host);

      return { focus, exposed };
    };

    it('should provide the display name', () => {
      const { exposed } = mountHost(false);

      expect(exposed.displayName).toStrictEqual('model.authConfig.provider.github');
    });

    it('should focus the control on mount when asked to', () => {
      const { focus } = mountHost(true);

      expect(focus).toHaveBeenCalledWith();
    });

    it('should not focus the control on mount when not asked to', () => {
      const { focus } = mountHost(false);

      expect(focus).not.toHaveBeenCalledWith();
    });

    it('should not throw when there is no control to focus', () => {
      expect(() => mountHost(true, false)).not.toThrow();
    });
  });
});
