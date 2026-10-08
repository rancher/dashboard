import { shallowMount } from '@vue/test-utils';
import AuthConfigCreateProvider from '@shell/pages/c/_cluster/auth/config/create/_provider.vue';
jest.mock('@shell/utils/require-asset', () => {
  return { requireAsset: jest.fn((path: string) => path) };
});

const type = {
  id: 'github', configTypeName: 'githubConfig', name: 'GitHub', category: 'oauth', categoryLabel: 'OAuth', icon: 'github.svg'
};

const createWrapper = (provider = 'github') => shallowMount(AuthConfigCreateProvider, {
  // The page resolves the provider type in fetch(), which shallowMount does not run
  data: () => ({
    type, value: {}, editComponent: {}
  } as any),
  global: {
    mocks: {
      $route:      { params: { cluster: 'local', provider } },
      $fetchState: { pending: false, error: null },
      $store:      {
        dispatch: jest.fn(),
        getters:  { 'i18n/withFallback': () => 'GitHub' },
      },
    },
  },
}) as any;

describe('page: AuthConfigCreateProvider', () => {
  // The provider's own form renders the name and description, and creates the
  // config when it first saves - this page tells it what it needs to do that.
  it('should hand the provider form what it needs to create a config', () => {
    const wrapper = createWrapper();

    expect(wrapper.vm.authConfigCreate).toStrictEqual({
      name:       '',
      normanType: '',
      takenIds:   [],
      created:    false,
    });
  });

  it('should report a provider this Rancher does not have', () => {
    const wrapper = shallowMount(AuthConfigCreateProvider, {
      data:   () => ({ type: null } as any),
      global: {
        mocks: {
          $route:      { params: { cluster: 'local', provider: 'nonsense' } },
          $fetchState: { pending: false, error: null },
          $store:      { dispatch: jest.fn(), getters: { 'i18n/withFallback': () => 'nonsense' } },
        },
      },
    }) as any;

    expect(wrapper.find('[data-testid="auth-config-back"]').exists()).toBe(false);
  });

  describe('the single enabled provider limit', () => {
    // Runs the page's fetch() against a store holding `configs`.
    const runFetch = async(configs: { id: string, enabled?: boolean }[], multipleAllowed = false) => {
      const ctx: any = {
        provider:         'github',
        authConfigCreate: {
          name: '', normanType: '', takenIds: [], created: false
        },
        limitReached:  false,
        value:         null,
        editComponent: null,
        $store:        {
          dispatch: jest.fn((action: string) => {
            if (action === 'management/findAll') {
              return Promise.resolve(configs);
            }
            if (action === 'auth/getAuthProviderTypes') {
              return Promise.resolve({ githubProvider: { Type: 'oauth' } });
            }

            return Promise.resolve({});
          }),
          getters: {
            'i18n/withFallback':   (_key: string, _args: any, fallback: string) => fallback,
            'type-map/importEdit': () => ({}),
            'features/get':        (name: string) => name === 'multiple-auth-providers' && multipleAllowed,
          },
        },
      };

      await (AuthConfigCreateProvider as any).fetch.call(ctx);

      return ctx;
    };

    it('should refuse a provider in community while another is enabled', async() => {
      const ctx = await runFetch([{ id: 'local', enabled: true }, { id: 'okta', enabled: true }]);

      expect(ctx.limitReached).toBe(true);
      expect(ctx.value).toBeNull();
    });

    it('should allow a provider in community when the configured one is switched off', async() => {
      const ctx = await runFetch([{ id: 'local', enabled: true }, { id: 'azuread', enabled: false }]);

      expect(ctx.limitReached).toBe(false);
      expect(ctx.value).toStrictEqual({});
    });

    it('should allow the first provider in community', async() => {
      const ctx = await runFetch([{ id: 'local', enabled: true }]);

      expect(ctx.limitReached).toBe(false);
    });

    it('should allow another provider when multiple are allowed', async() => {
      const ctx = await runFetch([{ id: 'local', enabled: true }, { id: 'okta', enabled: true }], true);

      expect(ctx.limitReached).toBe(false);
    });

    it('should explain the limit instead of showing the form', () => {
      const wrapper = shallowMount(AuthConfigCreateProvider, {
        data:   () => ({ type, limitReached: true } as any),
        global: {
          mocks: {
            $route:      { params: { cluster: 'local', provider: 'github' } },
            $fetchState: { pending: false, error: null },
            $store:      { dispatch: jest.fn(), getters: { 'i18n/withFallback': () => 'GitHub' } },
          },
        },
      }) as any;

      expect(wrapper.find('[data-testid="auth-config-limit-reached"]').attributes('label')).toBe('%authConfig.create.limitReached%');
      expect(wrapper.find('.auth-config-title').exists()).toBe(false);
    });
  });
});
