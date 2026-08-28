import { shallowMount } from '@vue/test-utils';
import Oidc from '@shell/components/auth/login/oidc.vue';

const createWrapper = (props: { name: string, type: string }) => shallowMount(Oidc, {
  props:  { focusOnMount: false, ...props },
  global: {
    // The label these tests are about lives in the button's default slot, which a
    // stub drops, leaving nothing to read.
    renderStubDefaultSlot: true,
    mocks:                 {
      t:      (key: string, args?: Record<string, string>) => (args ? `${ key }:${ args.provider }` : key),
      $store: { dispatch: jest.fn() },
    },
  },
});

describe('component: oidc login', () => {
  // The button used to name the protocol whatever the config was, so a Keycloak
  // and a generic OIDC provider both offered "Log in with OIDC" while the list
  // that led here told them apart.
  it.each([
    ['keycloakoidc', 'keyCloakOIDCProvider', 'model.authConfig.provider.keycloakoidc'],
    ['genericoidc', 'genericOIDCProvider', 'model.authConfig.provider.genericoidc'],
    ['cognito', 'cognitoProvider', 'model.authConfig.provider.cognito'],
  ])('should name the provider behind a config named after it (%s)', (name, type, expected) => {
    const wrapper = createWrapper({ name, type });

    expect(wrapper.text()).toBe(`login.loginWithProvider:${ expected }`);
  });

  // Same rule as every other provider: a name the admin chose is the only thing
  // telling one OIDC config from its siblings, so the button keeps it.
  it('should name a config the admin named with that name', () => {
    const wrapper = createWrapper({ name: 'okta-oidc', type: 'genericOIDCProvider' });

    expect(wrapper.text()).toBe('login.loginWithProvider:okta-oidc');
  });

  it('should sign in against the config, not the provider', () => {
    const wrapper = createWrapper({ name: 'okta-oidc', type: 'genericOIDCProvider' });

    wrapper.vm.login();

    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('auth/redirectTo', { provider: 'okta-oidc' });
  });
});
