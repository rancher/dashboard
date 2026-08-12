import { shallowMount } from '@vue/test-utils';
import Login from '@shell/pages/auth/login.vue';
import { REMEMBERED_PROVIDER_KEY } from '@shell/utils/auth-providers';

jest.mock('@shell/utils/require-asset', () => {
  return { requireAsset: jest.fn((path: string) => path) };
});

jest.mock('@shell/config/private-label', () => {
  return {
    getVendor: () => 'Rancher',
    getBrand:  () => '',
    setVendor: jest.fn(),
    setBrand:  jest.fn(),
  };
});

const LOCAL = { id: 'local', type: 'localProvider' };
const OKTA_CORP = { id: 'okta-corp', type: 'oktaProvider' };
const OKTA_PARTNER = { id: 'okta-partner', type: 'oktaProvider' };
const GITHUB = { id: 'gh-community', type: 'githubProvider' };
const AD = { id: 'ad-corp', type: 'activeDirectoryProvider' };

const createWrapper = (drivers: object[]) => {
  const dispatch = jest.fn((action: string) => {
    if (action === 'auth/getAuthProviders') {
      return Promise.resolve(drivers);
    }

    // The banners setting, whose value the page JSON-parses.
    return Promise.resolve({ value: '{"loginError":{}}' });
  });

  const wrapper = shallowMount(Login, {
    global: {
      mocks: {
        $store: {
          dispatch,
          getters: {
            'i18n/t':                  (key: string) => key,
            'i18n/withFallback':       (_key: string, _args: object | null, fallback: string) => fallback,
            'i18n/hasMultipleLocales': false,
            'cookies/get':             () => '',
            'management/byId':         () => ({ value: 'false' }),
            'management/brand':        '',
            'type-map/importLogin':    () => ({ template: '<div />' }),
            isSingleProduct:           undefined,
          },
        },
        $route:      { query: {} },
        $router:     { applyQuery: jest.fn(), push: jest.fn() },
        $fetchState: { pending: false },
      },
    },
  });

  return wrapper;
};

/** Runs the page's `fetch()` hook, which vue-test-utils does not invoke itself. */
const runFetch = async(wrapper: any) => {
  await (Login as any).fetch.call(wrapper.vm);
  await wrapper.vm.$nextTick();
};

describe('page: login', () => {
  beforeEach(() => window.localStorage.clear());

  describe('provider selection', () => {
    it('should offer the list once several providers are configured', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, OKTA_PARTNER]);

      await runFetch(wrapper);

      expect(wrapper.vm.showProviderList).toBe(true);
    });

    // A single provider has nothing to choose between, so the page keeps the
    // plain "Use a local user" link it has always shown.
    it('should not offer the list for a single provider', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP]);

      await runFetch(wrapper);

      expect(wrapper.vm.showProviderList).toBe(false);
    });

    it('should not offer the list when only local is configured', async() => {
      const wrapper = createWrapper([LOCAL]);

      await runFetch(wrapper);

      expect(wrapper.vm.showProviderList).toBe(false);
    });

    it('should list local alongside the external providers', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);

      expect(wrapper.vm.providerOptions.map((o: any) => o.id)).toStrictEqual(['gh-community', 'okta-corp', 'local']);
    });

    it('should open on the first provider by default', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);

      expect(wrapper.vm.selectedProviderId).toBe('gh-community');
    });

    it('should point the login component at the selected provider', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions[1]);

      expect(wrapper.vm.selectedProviderId).toBe('okta-corp');
      // `providerComponents` is built in step with `providers`, so the index has
      // to land on the same provider.
      expect(wrapper.vm.selectedProviderIndex).toBe(1);
      expect((wrapper.vm.providers as any[])[1].id).toBe('okta-corp');
    });

    it('should reveal the local form when local is chosen', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      const local = wrapper.vm.providerOptions.find((o: any) => o.isLocal);

      wrapper.vm.selectProvider(local);

      expect(wrapper.vm.showLocal).toBe(true);
    });

    // A username and password form owns the panel, so the alternatives collapse
    // to a "Choose a different provider" link until the user asks for them.
    it('should collapse the list while the local form is showing', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions.find((o: any) => o.isLocal));

      expect(wrapper.vm.isCredentialForm).toBe(true);
      expect(wrapper.vm.hasProviderChoice).toBe(true);
      expect(wrapper.vm.showProviderList).toBe(false);
    });

    it('should collapse the list for a directory provider, which asks for credentials too', async() => {
      const wrapper = createWrapper([LOCAL, AD, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions.find((o: any) => o.id === 'ad-corp'));

      expect(wrapper.vm.isCredentialForm).toBe(true);
      expect(wrapper.vm.showProviderList).toBe(false);
    });

    it('should reveal the list when a different provider is asked for', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions.find((o: any) => o.isLocal));
      wrapper.vm.expandProviderList();

      expect(wrapper.vm.showProviderList).toBe(true);
    });

    // Leaving the form in place would sit it above the very list meant to
    // replace it, so the panel drops back to the provider it opened on.
    it('should step off the form when a different provider is asked for', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions.find((o: any) => o.isLocal));
      wrapper.vm.expandProviderList();

      expect(wrapper.vm.selectedProviderId).toBe('gh-community');
      expect(wrapper.vm.showLocal).toBe(false);
      expect(wrapper.vm.isCredentialForm).toBe(false);
    });

    // Remembering local and then asking for the list would otherwise land back
    // on the form the user is trying to leave.
    it('should skip the remembered provider when it is the one on screen', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'local');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.expandProviderList();

      expect(wrapper.vm.selectedProviderId).toBe('gh-community');
    });

    // The page is choosing here, not the user.
    it('should not overwrite the remembered provider when it steps off the form', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'local');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.expandProviderList();

      expect(window.localStorage.getItem(REMEMBERED_PROVIDER_KEY)).toBe('local');
    });

    // Otherwise the list would stay open behind the next form.
    it('should collapse the list again once a provider is chosen from it', async() => {
      const wrapper = createWrapper([LOCAL, AD, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions.find((o: any) => o.isLocal));
      wrapper.vm.expandProviderList();
      wrapper.vm.selectProvider(wrapper.vm.providerOptions.find((o: any) => o.id === 'ad-corp'));

      expect(wrapper.vm.showProviderList).toBe(false);
    });

    it('should keep the list open for a provider that redirects away', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions.find((o: any) => o.id === 'okta-corp'));

      expect(wrapper.vm.isCredentialForm).toBe(false);
      expect(wrapper.vm.showProviderList).toBe(true);
    });

    it('should hide the local form when an external provider is chosen', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions.find((o: any) => o.isLocal));
      wrapper.vm.selectProvider(wrapper.vm.providerOptions[0]);

      expect(wrapper.vm.showLocal).toBe(false);
    });
  });

  describe('single provider fallback links', () => {
    it('should name the provider in the "use a non-local user" link', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP]);

      await runFetch(wrapper);

      // Previously the whole provider object was stringified into the key,
      // rendering "[object object]".
      expect(wrapper.vm.nonLocalPrompt).toBe('login.useProvider');
      expect((wrapper.vm.singleProvider as any)?.name).toBe('okta-corp');
    });

    it('should fall back to the generic prompt with several providers', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);

      expect(wrapper.vm.singleProvider).toBeUndefined();
      expect(wrapper.vm.nonLocalPrompt).toBe('login.useNonLocal');
    });
  });

  describe('remembering a provider', () => {
    it('should open on the remembered provider', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'okta-corp');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);

      expect(wrapper.vm.selectedProviderId).toBe('okta-corp');
      expect(wrapper.vm.rememberProvider).toBe(true);
    });

    it('should open the local form when local is the remembered provider', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'local');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);

      expect(wrapper.vm.showLocal).toBe(true);
    });

    // The admin can delete or rename a config out from under a saved choice.
    it('should fall back when the remembered provider no longer exists', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'deleted-config');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);

      expect(wrapper.vm.selectedProviderId).toBe('gh-community');
    });

    it('should not claim to remember a provider that no longer exists', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'deleted-config');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);

      expect(wrapper.vm.rememberProvider).toBe(false);
    });

    it('should save the current provider when the box is ticked', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions[1]);
      wrapper.vm.setRememberProvider(true);

      expect(window.localStorage.getItem(REMEMBERED_PROVIDER_KEY)).toBe('okta-corp');
    });

    it('should follow later selections once the box is ticked', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.setRememberProvider(true);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions[1]);

      expect(window.localStorage.getItem(REMEMBERED_PROVIDER_KEY)).toBe('okta-corp');
    });

    it('should forget the choice when the box is unticked', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'okta-corp');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.setRememberProvider(false);

      expect(window.localStorage.getItem(REMEMBERED_PROVIDER_KEY)).toBeNull();
    });

    it('should not save anything while the box is unticked', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.selectProvider(wrapper.vm.providerOptions[1]);

      expect(window.localStorage.getItem(REMEMBERED_PROVIDER_KEY)).toBeNull();
    });
  });
});
