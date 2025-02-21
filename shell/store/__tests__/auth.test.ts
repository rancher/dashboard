import { actions } from '@shell/store/auth';
import { createStore } from 'vuex';

// jest.mock('@shell/utils/url', () => ({
//   addParams:   () => ({}),
//   parse:       () => ({}),
//   removeParam: () => ({}),
// }));

describe('action: redirectTo', () => {
  it('should include query parameters from redirect', async() => {
    jest.spyOn(window, 'window', 'get');
    const store = { dispatch: jest.fn() };
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
    ['genericoidc', '://myhost/?redirect_uri=anyURI&scope=openid%20profile%20email&state=undefined'],
  ])('given provider %p should return URL %p', async(provider, expectation) => {
    jest.spyOn(window, 'window', 'get');
    const store = { dispatch: jest.fn() };
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
      const store = { dispatch: jest.fn() };

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
      const store = { dispatch: jest.fn() };

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
