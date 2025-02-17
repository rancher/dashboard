import { actions } from '@shell/store/auth';
import { createStore } from 'vuex';

describe('action: redirectTo', () => {
  it('should include query parameters from redirect', async() => {
    jest.spyOn(window, 'window', 'get');
    const store = { dispatch: jest.fn() };
    const clientId = '123';
    const uri = 'anyURI';
    const extras = '&response_type=code&response_mode=query&scope=&state=undefined';
    const expectation = `:///?client_id=${ clientId }&redirect_uri=${ uri }${ extras }`;
    const options = {
      provider:    'azuread',
      redirect:    false,
      redirectUrl: `?client_id=${ clientId }&redirect_uri=${ uri }`,
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

  it('should keep scope from options', async() => {
    const scope = 'myScope';
    const options = {
      provider:    'genericoidc',
      redirectUrl: 'anyURL',
      scope,
      test:        true,
      redirect:    false
    };
    const store = { dispatch: jest.fn() };

    jest.spyOn(window, 'window', 'get');
    const url = await actions.redirectTo(store as any, options);

    expect(url).toContain(scope);
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
        scope:    body.scope,
        test:     true,
        redirect: false
      };

      await actions.test(store, { provider, body });

      expect(dispatchSpy.mock.calls[0][1]).toStrictEqual(options);
    });
  });
});
