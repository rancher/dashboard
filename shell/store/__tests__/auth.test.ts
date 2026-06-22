import { actions, getters } from '@shell/store/auth';
import { createStore } from 'vuex';

// jest.mock('@shell/utils/url', () => ({
//   addParams:   () => ({}),
//   parse:       () => ({}),
//   removeParam: () => ({}),
// }));

describe('action: redirectTo', () => {
  it('should include query parameters from redirect', async() => {
    jest.spyOn(window, 'window', 'get');
    const store = {
      dispatch: jest.fn((x) => {
        if (x === 'getAuthProvider') return { scopes: '' };
      })
    };
    const clientId = '123';
    const uri = 'anyURI';
    const scope = 'anything';
    const expectation = `:///?client_id=${ clientId }&redirect_uri=${ uri }&response_type=code&response_mode=query&scope=${ scope }&state=undefined`;
    const options = {
      provider:    'azuread',
      redirect:    false,
      redirectUrl: `?client_id=${ clientId }&redirect_uri=${ uri }&scope=${ scope }`,
    };

    const url = await actions.redirectTo(store as any, options);

    expect(url).toStrictEqual(expectation);
  });

  it.each([
    ['genericoidc', '://myhost/?redirect_uri=anyURI&scope=openid%20profile%20email%20groups&state=undefined'],
  ])('given provider %p should return URL %p', async(provider, expectation) => {
    jest.spyOn(window, 'window', 'get');
    const store = {
      dispatch: jest.fn((x) => {
        if (x === 'getAuthProvider') return { scopes: 'groups' };
      })
    };
    const uri = 'anyURI'; // This field is added anyway, so we set a random value
    const options = {
      provider,
      redirect:    false,
      redirectUrl: `myhost?redirect_uri=${ uri }`,
    };

    const url = await actions.redirectTo(store as any, options);

    expect(url).toStrictEqual(expectation);
  });

  describe.each([
    // 'whatever',
    // 'github',
    // 'googleoauth',
    // 'azuread',
    // 'keycloakoidc',
    'genericoidc',
  ])('given provider %p', (provider) => {
    it('should keep scope from options', async() => {
      const customScope = 'myScope';
      const options = {
        provider,
        redirectUrl: 'anyURL',
        scopes:      customScope,
        // scopesJoinChar: ' ', // it's not used for genericoidc
        test:        true,
        redirect:    false
      };
      const store = {
        dispatch: jest.fn((x) => {
          if (x === 'getAuthProvider') return { scopes: '' };
        })
      };

      jest.spyOn(window, 'window', 'get');
      const url = await actions.redirectTo(store as any, options);

      expect(url).toContain(customScope);
    });

    it('should merge scopes into a single string and avoid duplication', async() => {
      const defaultScopes = 'openid profile email';
      const customScope = 'myScope';
      const options = {
        provider,
        redirectUrl: 'anyURL',
        scopes:      `${ defaultScopes } ${ customScope }`,
        test:        true,
        redirect:    false
      };
      const store = {
        dispatch: jest.fn((x) => {
          if (x === 'getAuthProvider') return { scopes: 'openid' };
        })
      };

      jest.spyOn(window, 'window', 'get');
      const url = await actions.redirectTo(store as any, options);

      expect(url).toContain('scope=openid%20profile%20email%20myScope&');
    });
  });
});

jest.mock('@shell/utils/auth');

describe('action: test', () => {
  describe('given providers with an action (github, google, azuread, oidc)', () => {
    it('should call redirectTo with all the options', async() => {
      const dispatchSpy = jest.fn().mockReturnValue('anyURL');
      const store = createStore({
        actions: {
          getAuthConfig: () => ({ doAction: () => 'no action' }),
          redirectTo:    dispatchSpy,
        }
      });
      const provider = 'anyProvider';
      const redirectUrl = undefined;
      const body = { scope: ['any scope'] };
      const options = {
        provider,
        redirectUrl,
        scopes:   body.scope,
        test:     true,
        redirect: false
      };

      await actions.test(store, { provider, body });

      expect(dispatchSpy.mock.calls[0][1]).toStrictEqual(options);
    });
  });
});

describe('getter: canCreateLocalUsers', () => {
  const createMockRootGetters = (featureEnabled: boolean, authConfigsLoaded: boolean, authConfigs: any[] = []) => ({
    'features/get': jest.fn(() => featureEnabled),
    'management/haveAll': jest.fn(() => authConfigsLoaded),
    'management/all': jest.fn(() => authConfigs),
  });

  describe('when feature flag is disabled', () => {
    it('should allow user creation regardless of auth providers', () => {
      const rootGetters = createMockRootGetters(false, true, [
        { id: 'github', enabled: true },
        { id: 'local', enabled: true }
      ]);

      const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

      expect(result).toBe(true);
    });

    it('should allow user creation even if auth configs are not loaded', () => {
      const rootGetters = createMockRootGetters(false, false, []);

      const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

      expect(result).toBe(true);
    });
  });

  describe('when feature flag is enabled', () => {
    describe('and auth configs are not loaded yet', () => {
      it('should prevent user creation (safe default)', () => {
        const rootGetters = createMockRootGetters(true, false, []);

        const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

        expect(result).toBe(false);
      });
    });

    describe('and auth configs are loaded', () => {
      it('should prevent user creation when a non-local auth provider is enabled', () => {
        const rootGetters = createMockRootGetters(true, true, [
          { id: 'github', enabled: true },
          { id: 'local', enabled: true }
        ]);

        const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

        expect(result).toBe(false);
      });

      it('should allow user creation when only local auth provider is enabled', () => {
        const rootGetters = createMockRootGetters(true, true, [
          { id: 'local', enabled: true }
        ]);

        const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

        expect(result).toBe(true);
      });

      it('should allow user creation when no auth providers are enabled', () => {
        const rootGetters = createMockRootGetters(true, true, [
          { id: 'github', enabled: false },
          { id: 'local', enabled: false }
        ]);

        const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

        expect(result).toBe(true);
      });

      it('should allow user creation when auth configs list is empty', () => {
        const rootGetters = createMockRootGetters(true, true, []);

        const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

        expect(result).toBe(true);
      });

      it('should prevent user creation when multiple non-local providers are enabled', () => {
        const rootGetters = createMockRootGetters(true, true, [
          { id: 'github', enabled: true },
          { id: 'azuread', enabled: true },
          { id: 'local', enabled: true }
        ]);

        const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

        expect(result).toBe(false);
      });

      it('should allow user creation when non-local providers exist but are disabled', () => {
        const rootGetters = createMockRootGetters(true, true, [
          { id: 'github', enabled: false },
          { id: 'azuread', enabled: false },
          { id: 'local', enabled: true }
        ]);

        const result = getters.canCreateLocalUsers({}, {}, {}, rootGetters);

        expect(result).toBe(true);
      });
    });
  });
});
