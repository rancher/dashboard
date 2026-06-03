import { shallowMount } from '@vue/test-utils';
import AllowedPrincipals from '@shell/components/auth/AllowedPrincipals.vue';

describe('component: AllowedPrincipals', () => {
  const defaultProps = {
    provider:   'github',
    authConfig: {
      nameDisplay:         'GitHub',
      accessMode:          '',
      allowedPrincipalIds: [],
    },
    mode: 'edit',
  };

  const globalMocks = {
    mocks: {
      $store: {
        getters: {
          'i18n/t':      (key: string) => key,
          'i18n/exists': () => true,
        }
      }
    },
    directives: { 'clean-html': () => {} },
    stubs:      {
      RadioGroup:      true,
      ArrayList:       true,
      Banner:          { template: '<div data-testid="auth-unrestricted-warning-banner"><slot /></div>', props: ['color'] },
      Principal:       true,
      SelectPrincipal: true,
    },
  };

  const createWrapper = (authConfigOverrides = {}) => {
    const authConfig = { ...defaultProps.authConfig, ...authConfigOverrides };

    return shallowMount(AllowedPrincipals, {
      props:  { ...defaultProps, authConfig },
      global: globalMocks,
    });
  };

  describe('default accessMode', () => {
    it('should default accessMode to required when not set', () => {
      const wrapper = createWrapper({ accessMode: '' });

      expect(wrapper.props('authConfig').accessMode).toStrictEqual('required');
    });

    it('should not override accessMode when already set', () => {
      const wrapper = createWrapper({ accessMode: 'restricted' });

      expect(wrapper.props('authConfig').accessMode).toStrictEqual('restricted');
    });
  });

  describe('unrestricted warning banner', () => {
    it('should show error banner when accessMode is unrestricted', () => {
      const wrapper = createWrapper({ accessMode: 'unrestricted' });
      const banner = wrapper.find('[data-testid="auth-unrestricted-warning-banner"]');

      expect(banner.exists()).toStrictEqual(true);
    });

    it('should not show error banner when accessMode is required', () => {
      const wrapper = createWrapper({ accessMode: 'required' });
      const banner = wrapper.find('[data-testid="auth-unrestricted-warning-banner"]');

      expect(banner.exists()).toStrictEqual(false);
    });

    it('should not show error banner when accessMode is restricted', () => {
      const wrapper = createWrapper({ accessMode: 'restricted' });
      const banner = wrapper.find('[data-testid="auth-unrestricted-warning-banner"]');

      expect(banner.exists()).toStrictEqual(false);
    });

    it('should show warning banner with warning color', () => {
      const wrapper = createWrapper({ accessMode: 'unrestricted' });
      const banner = wrapper.findComponent('[data-testid="auth-unrestricted-warning-banner"]');

      expect(banner.props('color')).toStrictEqual('warning');
    });
  });
});
