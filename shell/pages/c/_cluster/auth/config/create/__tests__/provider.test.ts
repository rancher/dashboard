import { shallowMount } from '@vue/test-utils';
import AuthConfigCreateProvider from '@shell/pages/c/_cluster/auth/config/create/_provider.vue';
import FailWhale from '@shell/components/FailWhale.vue';
import { setVersionData } from '@shell/config/version';
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
      name:        '',
      normanType:  '',
      takenIds:    [],
      created:     false,
      cloneValues: null,
    });
  });

  it('should report a provider this Rancher does not have on the error page', () => {
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

    expect(wrapper.findComponent(FailWhale).props('error').message).toBe('%authConfig.create.unknownProvider%');
    expect(wrapper.find('.auth-config-title').exists()).toBe(false);
  });

  // A request that failed says nothing about whether the provider is supported.
  it('should report a failure to load rather than call the provider unsupported', () => {
    const error = { message: 'Service Unavailable', statusCode: 503 };
    const wrapper = shallowMount(AuthConfigCreateProvider, {
      data:   () => ({ type: null } as any),
      global: {
        mocks: {
          $route:      { params: { cluster: 'local', provider: 'github' } },
          $fetchState: { pending: false, error },
          $store:      { dispatch: jest.fn(), getters: { 'i18n/withFallback': () => 'GitHub' } },
        },
      },
    }) as any;

    expect(wrapper.findComponent(FailWhale).props('error')).toStrictEqual(error);
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

    it('should explain the limit on the error page instead of showing the form', () => {
      const wrapper = shallowMount(AuthConfigCreateProvider, {
        // fetch() stops at the limit before it resolves the provider type
        data:   () => ({ type: null, limitReached: true } as any),
        global: {
          mocks: {
            $route:      { params: { cluster: 'local', provider: 'github' } },
            $fetchState: { pending: false, error: null },
            $store:      { dispatch: jest.fn(), getters: { 'i18n/withFallback': () => 'GitHub' } },
          },
        },
      }) as any;

      expect(wrapper.findComponent(FailWhale).props('error').message).toBe('%authConfig.create.limitReached%');
      expect(wrapper.find('.auth-config-title').exists()).toBe(false);
    });

    // Prime already has the feature; the flag being off is what to fix
    it('should point Prime at the feature flag rather than at Prime', () => {
      setVersionData({ RancherPrime: 'true' });
      const wrapper = shallowMount(AuthConfigCreateProvider, {
        data:   () => ({ type: null, limitReached: true } as any),
        global: {
          mocks: {
            $route:      { params: { cluster: 'local', provider: 'github' } },
            $fetchState: { pending: false, error: null },
            $store:      { dispatch: jest.fn(), getters: { 'i18n/withFallback': () => 'GitHub' } },
          },
        },
      }) as any;
      const message = wrapper.findComponent(FailWhale).props('error').message;

      setVersionData({});

      expect(message).toBe('%authConfig.create.limitReachedPrime%');
    });
  });

  describe('cloning a config', () => {
    const configs = [
      {
        id: 'local', enabled: true, _type: 'localConfig'
      },
      {
        id: 'github', enabled: false, _type: 'githubConfig', nameDisplay: 'GitHub'
      },
    ];
    const source = {
      id: 'github', enabled: false, hostname: 'github.example.com', clientId: 'abc', clientSecret: 'cattle-global-data:githubconfig-clientsecret'
    };
    const resourceFields = {
      enabled: { type: 'boolean' }, hostname: { type: 'string' }, clientId: { type: 'string' }, clientSecret: { type: 'password' }
    };

    const runFetch = async(cloneId: string) => {
      const ctx: any = {
        provider:         'github',
        cloneId,
        cloneSource:      null,
        authConfigCreate: {
          name: '', normanType: '', takenIds: [], created: false, cloneValues: null
        },
        limitReached:  false,
        value:         null,
        editComponent: null,
        $store:        {
          dispatch: jest.fn((action: string) => {
            switch (action) {
            case 'management/findAll': return Promise.resolve(configs);
            case 'auth/getAuthProviderTypes': return Promise.resolve({ githubProvider: { Type: 'oauth' } });
            case 'rancher/find': return Promise.resolve(source);
            default: return Promise.resolve({});
            }
          }),
          getters: {
            'i18n/withFallback':   (_key: string, _args: any, fallback: string) => fallback,
            'type-map/importEdit': () => ({}),
            'features/get':        () => false,
            'rancher/schemaFor':   (type: string) => (type === 'githubConfig' ? { resourceFields } : undefined),
          },
        },
      };

      await (AuthConfigCreateProvider as any).fetch.call(ctx);

      return ctx;
    };

    it('should start the new config from the settings of the one cloned', async() => {
      const ctx = await runFetch('github');

      expect(ctx.authConfigCreate.cloneValues).toStrictEqual({ hostname: 'github.example.com', clientId: 'abc' });
    });

    // The admin can review and rename it before it is written
    it('should suggest the next free name for the clone', async() => {
      const ctx = await runFetch('github');

      expect(ctx.authConfigCreate.name).toBe('github-2');
    });

    it('should not clone a config of another provider', async() => {
      const ctx = await runFetch('local');

      expect(ctx.cloneSource).toBeNull();
      expect(ctx.authConfigCreate.cloneValues).toBeNull();
    });

    const mountPage = (cloneSource: object | null) => shallowMount(AuthConfigCreateProvider, {
      data: () => ({
        type, value: {}, editComponent: {}, cloneSource
      } as any),
      global: {
        mocks: {
          $route:      { params: { cluster: 'local', provider: 'github' }, query: { cloneConfig: 'github' } },
          $fetchState: { pending: false, error: null },
          $store:      { dispatch: jest.fn(), getters: { 'i18n/withFallback': () => 'GitHub' } },
        },
      },
    }) as any;

    it('should title the page after the config being cloned', () => {
      const wrapper = mountPage({ id: 'github', nameDisplay: 'GitHub' });

      expect(wrapper.find('[data-testid="auth-config-create-title"]').text()).toBe('%authConfig.create.clone.title%');
    });

    it('should report a config that cannot be cloned on the error page', () => {
      const wrapper = mountPage(null);

      expect(wrapper.findComponent(FailWhale).props('error').message).toBe('%authConfig.create.clone.notFound%');
    });
  });
});
