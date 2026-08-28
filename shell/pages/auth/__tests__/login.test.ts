import { shallowMount } from '@vue/test-utils';
import Login from '@shell/pages/auth/login.vue';
import AuthProviderList from '@shell/components/auth/login/AuthProviderList.vue';
import { Banner } from '@components/Banner';
import { LOGGED_OUT, TIMED_OUT, _FLAGGED } from '@shell/config/query-params';
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

const createWrapper = (drivers: object[], query: Record<string, string | null> = {}) => {
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
        $route:      { query },
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

  describe('messages', () => {
    it('should show an error message in an error banner', () => {
      const wrapper = createWrapper([LOCAL], { err: 'Something went wrong' });
      const banner = wrapper.findComponent(Banner);

      expect(wrapper.vm.loginMessages).toStrictEqual([{ message: 'login.specificError', variant: 'error' }]);
      expect(banner.props('color')).toBe('error');
      expect(banner.props('label')).toBe('login.specificError');
      expect(banner.props('role')).toBe('alert');
    });

    it('should show a logged-out message in a success banner', () => {
      const wrapper = createWrapper([LOCAL], { [LOGGED_OUT]: _FLAGGED });
      const banner = wrapper.findComponent(Banner);

      expect(wrapper.vm.loginMessages).toStrictEqual([{ message: 'login.loggedOut', variant: 'success' }]);
      expect(banner.props('color')).toBe('success');
      expect(banner.props('label')).toBe('login.loggedOut');
      expect(banner.props('role')).toBe('status');
    });

    it('should show a timed-out message in an error banner', () => {
      const wrapper = createWrapper([LOCAL], { [TIMED_OUT]: _FLAGGED });
      const banner = wrapper.findComponent(Banner);

      expect(wrapper.vm.loginMessages).toStrictEqual([{ message: 'login.loginAgain', variant: 'error' }]);
      expect(banner.props('color')).toBe('error');
      expect(banner.props('label')).toBe('login.loginAgain');
      expect(banner.props('role')).toBe('alert');
    });
  });

  describe('provider selection', () => {
    it('should offer the list once several providers are configured', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP, OKTA_PARTNER]);

      await runFetch(wrapper);

      expect(wrapper.vm.showProviderList).toBe(true);
    });

    // Local is one of the ways in, so a single external provider alongside it is
    // still a choice, and it is offered from the list like any other.
    it('should offer the list for a single provider alongside local', async() => {
      const wrapper = createWrapper([LOCAL, OKTA_CORP]);

      await runFetch(wrapper);

      expect(wrapper.vm.showProviderList).toBe(true);
      expect(wrapper.vm.providerOptions.map((o: any) => o.id)).toStrictEqual(['okta-corp', 'local']);
    });

    // Nothing to choose between, so the page goes straight to that provider.
    it('should not offer the list for a single provider without local', async() => {
      const wrapper = createWrapper([OKTA_CORP]);

      await runFetch(wrapper);

      expect(wrapper.vm.showProviderList).toBe(false);
      expect(wrapper.vm.selectedProviderId).toBe('okta-corp');
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

    // The box is a statement about the provider on screen, so leaving it ticked
    // against the one the page just stepped onto would claim a choice was saved
    // that signing in from here would not honour.
    it('should stop claiming to remember once it steps off the remembered provider', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'local');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);

      expect(wrapper.vm.rememberProvider).toBe(true);

      wrapper.vm.expandProviderList();

      expect(wrapper.vm.selectedProviderId).toBe('gh-community');
      expect(wrapper.vm.rememberProvider).toBe(false);
    });

    // Ticking the box from here is the user choosing, so it saves the provider
    // they are actually looking at rather than the one they arrived on.
    it('should save the stepped-onto provider when the box is ticked again', async() => {
      window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'local');
      const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

      await runFetch(wrapper);
      wrapper.vm.expandProviderList();
      wrapper.vm.setRememberProvider(true);

      expect(window.localStorage.getItem(REMEMBERED_PROVIDER_KEY)).toBe('gh-community');
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

  describe('offering local', () => {
    // Local used to be reached through a "Use a local user" link. It is a card in
    // the list now, so the link is gone and the list has to carry local instead.
    it.each([
      ['a single external provider', [LOCAL, OKTA_CORP]],
      ['several external providers', [LOCAL, OKTA_CORP, GITHUB]],
    ])('should offer local from the list with %s', async(_label, drivers) => {
      const wrapper = createWrapper(drivers);

      await runFetch(wrapper);

      const list = wrapper.findComponent(AuthProviderList);

      expect(list.exists()).toBe(true);
      expect((list.props('options') as any[]).some((o) => o.isLocal)).toBe(true);
      expect(wrapper.find('[data-testid="login-useLocal"]').exists()).toBe(false);
    });

    it('should show the local form on its own when local is all there is', async() => {
      const wrapper = createWrapper([LOCAL]);

      await runFetch(wrapper);

      expect(wrapper.vm.showLocal).toBe(true);
      expect(wrapper.findComponent(AuthProviderList).exists()).toBe(false);
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

    // There is nothing to save unless the page is asking which external provider
    // to use. One of them alongside local is answered the same way every time.
    describe('with fewer than two external providers', () => {
      it.each([
        ['a single external provider alongside local', [LOCAL, OKTA_CORP]],
        ['a single external provider on its own', [OKTA_CORP]],
        ['only local', [LOCAL]],
      ])('should not offer the box with %s', async(_label, drivers) => {
        const wrapper = createWrapper(drivers);

        await runFetch(wrapper);

        expect(wrapper.vm.canRememberProvider).toBe(false);
        expect(wrapper.find('[data-testid="login-provider-remember"]').exists()).toBe(false);
      });

      it('should offer the box once a second external provider is configured', async() => {
        const wrapper = createWrapper([LOCAL, OKTA_CORP, GITHUB]);

        await runFetch(wrapper);

        expect(wrapper.vm.canRememberProvider).toBe(true);
        expect(wrapper.find('[data-testid="login-provider-remember"]').exists()).toBe(true);
      });

      // The admin can remove a provider out from under a saved choice, leaving an
      // entry the page no longer gives the user any way to clear.
      it('should ignore a choice saved before the providers were reduced', async() => {
        window.localStorage.setItem(REMEMBERED_PROVIDER_KEY, 'local');
        const wrapper = createWrapper([LOCAL, OKTA_CORP]);

        await runFetch(wrapper);

        expect(wrapper.vm.selectedProviderId).toBe('okta-corp');
        expect(wrapper.vm.showLocal).toBe(false);
        expect(wrapper.vm.rememberProvider).toBe(false);
      });
    });
  });
});
