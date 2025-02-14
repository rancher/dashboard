import { actions } from '@shell/store/auth';

describe('action: redirectTo', () => {
  it('should include query parameters from redirect', async() => {
    jest
      .spyOn(window, 'window', 'get')
      .mockReturnValue({ location: { href: '' } } as any);
    const store = {
      state:    {},
      commit:   jest.fn(),
      dispatch: jest.fn(),
    };
    const clientId = '123';
    const uri = 'whatever';
    const extras = '&response_type=code&response_mode=query&scope=&state=undefined';
    const expectation = `:///?client_id=${ clientId }&redirect_uri=${ uri }${ extras }`;
    const opt = {
      provider:    'azuread',
      redirect:    false,
      redirectUrl: `?client_id=${ clientId }&redirect_uri=${ uri }`,
    };

    const url = await actions.redirectTo(store, opt);

    expect(url).toStrictEqual(expectation);
  });

  it.each([
    ['genericoidc', '://whatever/?redirect_uri=whatever&scope=openid%20profile%20email&state=undefined'],
  ])('given provider %p should return URL %p', async(provider, expectation) => {
    jest
      .spyOn(window, 'window', 'get')
      .mockReturnValue({ location: { href: '' } } as any);
    const store = {
      state:    {},
      commit:   jest.fn(),
      dispatch: jest.fn(),
    };
    const uri = 'whatever'; // This field is added anyway, so we set a random value
    const opt = {
      provider,
      redirect:    false,
      redirectUrl: `whatever?redirect_uri=${ uri }`,
    };

    const url = await actions.redirectTo(store, opt);

    expect(url).toStrictEqual(expectation);
  });
});

describe('action: test', () => {
  it('should call redirect with all the options', async() => {
    const provider = 'whatever';
    const redirectUrl = 'whatever';
    const body = { scope: ['whatever'] };
    const options = {
      provider,
      redirectUrl,
      scope:    body.scope,
      test:     true,
      redirect: false
    };
    const dispatchSpy = jest.fn().mockResolvedValue({ doAction: () => ({ redirectUrl }) });
    const store = {
      state:    {},
      commit:   jest.fn(),
      dispatch: dispatchSpy,
    };

    await actions.test(store, { provider, body });

    expect(dispatchSpy).toHaveBeenCalledWith('dispatch', options);
  });
});
