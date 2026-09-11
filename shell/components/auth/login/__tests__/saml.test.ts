import { shallowMount } from '@vue/test-utils';
import Saml from '@shell/components/auth/login/saml.vue';

const VALID_QUERY = {
  cli:          'true',
  requestId:    'f5gthk4dsva2dg7s7nrnjlv1r9w8cr1a',
  publicKey:    'eyJOIjoyOTQxNCwiRSI6NjU1Mzd9',
  responseType: 'kubeconfig',
};

const createWrapper = (query: Record<string, string> = {}, dispatch = jest.fn()) => shallowMount(Saml, {
  props: {
    focusOnMount: false, name: 'shibboleth', type: 'shibbolethProvider'
  },
  global: {
    // The messages these tests are about live in the button's default slot, which
    // a stub drops, leaving nothing to read.
    renderStubDefaultSlot: true,
    mocks:                 {
      t:      (key: string) => key,
      $route: { query },
      $store: { dispatch },
    },
  },
});

describe('component: saml login', () => {
  describe('CLI login detection', () => {
    it.each([
      ['cli', { cli: 'true' }],
      ['requestId', { requestId: VALID_QUERY.requestId }],
      ['publicKey', { publicKey: VALID_QUERY.publicKey }],
      ['responseType', { responseType: VALID_QUERY.responseType }],
    ])('should treat a login carrying %s as a CLI login', (_, query) => {
      const wrapper = createWrapper(query);

      expect(wrapper.find('.cli-login').exists()).toBe(true);
    });

    it('should treat a login carrying none of the CLI params as a browser login', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('.cli-login').exists()).toBe(false);
    });
  });

  describe('response type validation', () => {
    // The CLI asks for `kubeconfig_<clusterId>` whenever it is given a cluster, and
    // rejecting that left anyone signing in for a specific cluster stuck on the
    // login page. See https://github.com/rancher/dashboard/issues/16626
    it.each([
      ['no cluster', 'kubeconfig'],
      ['the local cluster', 'kubeconfig_local'],
      ['a downstream cluster', 'kubeconfig_c-m-zx8p4nvt'],
      ['a cluster whose id contains an underscore', 'kubeconfig_c-m-zx8p_4nvt'],
    ])('should accept a request for %s', (_, responseType) => {
      const wrapper = createWrapper({ ...VALID_QUERY, responseType });

      expect(wrapper.find('.cli-error').exists()).toBe(false);
      expect(wrapper.find('[data-testid="login-provider-submit"]').exists()).toBe(true);
    });

    it.each([
      ['a response type the dashboard cannot serve', 'json'],
      ['a response type that merely starts the same', 'kubeconfigs'],
      ['a cluster-scoped request with no cluster', 'kubeconfig_'],
      ['an empty response type', ''],
    ])('should reject %s', (_, responseType) => {
      const wrapper = createWrapper({ ...VALID_QUERY, responseType });

      expect(wrapper.find('.cli-error').exists()).toBe(true);
      expect(wrapper.find('[data-testid="login-provider-submit"]').exists()).toBe(false);
    });

    it.each([
      ['requestId', 'requestId'],
      ['publicKey', 'publicKey'],
    ])('should reject a CLI login missing its %s', (_, param) => {
      const wrapper = createWrapper({ ...VALID_QUERY, [param]: '' });

      expect(wrapper.find('.cli-error').exists()).toBe(true);
    });
  });

  describe('signing in', () => {
    const location = window.location;

    beforeAll(() => {
      // login() sends the browser to the IdP, which jsdom refuses to do
      Object.defineProperty(window, 'location', {
        configurable: true,
        value:        { origin: 'https://127.0.0.1:8005', href: '' },
      });
    });

    afterAll(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: location });
    });

    it('should hand the cluster-scoped response type to the auth provider untouched', async() => {
      const query = { ...VALID_QUERY, responseType: 'kubeconfig_c-m-zx8p4nvt' };
      const dispatch = jest.fn().mockResolvedValue({ idpRedirectUrl: 'https://mocksaml.com/api/saml/sso' });
      const wrapper = createWrapper(query, dispatch);

      await wrapper.vm.login();

      expect(dispatch).toHaveBeenCalledWith('auth/login', {
        provider: 'shibboleth',
        body:     {
          finalRedirectUrl: window.location.origin,
          requestId:        query.requestId,
          publicKey:        query.publicKey,
          responseType:     query.responseType,
        },
      });
    });
  });
});
