import { authenticate } from '@shell/config/router/navigation-guards/authentication';

jest.mock('@shell/utils/router', () => ({ routeRequiresAuthentication: () => true }));

const isLoggedInMock = jest.fn();
const findMeMock = jest.fn();
const notLoggedInMock = jest.fn();
const noAuthMock = jest.fn();

jest.mock('@shell/utils/auth', () => {
  const actual = jest.requireActual('@shell/utils/auth');

  return {
    ...actual,
    isLoggedIn:  (...args: any[]) => isLoggedInMock(...args),
    findMe:      (...args: any[]) => findMeMock(...args),
    notLoggedIn: (...args: any[]) => notLoggedInMock(...args),
    noAuth:      (...args: any[]) => noAuthMock(...args),
  };
});

function makeStore({ user, fromHeader }: { user: any, fromHeader: string }) {
  const getters: Record<string, any> = {
    'auth/enabled':    true,
    'auth/loggedIn':   false,
    'auth/user':       user,
    'auth/fromHeader': fromHeader,
  };

  return {
    dispatch: jest.fn().mockResolvedValue(undefined),
    commit:   jest.fn(),
    getters,
  };
}

const to = { name: 'c-cluster-explorer', query: {} };

describe('navigation-guards/authentication: mustChangePassword', () => {
  beforeEach(() => {
    isLoggedInMock.mockReset().mockResolvedValue(undefined);
    findMeMock.mockReset();
    notLoggedInMock.mockReset();
    noAuthMock.mockReset();
  });

  it('redirects local users with mustChangePassword to auth-setup', async() => {
    const store = makeStore({
      user:       { mustChangePassword: true, principalIds: ['local://user-1'] },
      fromHeader: 'true',
    });

    findMeMock.mockResolvedValue({ id: 'local://user-1', provider: 'local' });

    const next = jest.fn();

    await authenticate(to as any, {} as any, next, { store } as any);

    expect(next).toHaveBeenCalledWith({ name: 'auth-setup' });
    expect(isLoggedInMock).not.toHaveBeenCalled();
  });

  it('lets SSO users with mustChangePassword reach the requested route', async() => {
    const me = { id: 'oidc_user://user@example.com', provider: 'genericoidc' };
    const store = makeStore({
      user:       { mustChangePassword: true, principalIds: ['local://user-1', me.id] },
      fromHeader: 'true',
    });

    findMeMock.mockResolvedValue(me);

    const next = jest.fn();

    await authenticate(to as any, {} as any, next, { store } as any);

    expect(next).toHaveBeenCalledWith();
    expect(next).not.toHaveBeenCalledWith({ name: 'auth-setup' });
    expect(isLoggedInMock).toHaveBeenCalledTimes(1);
  });

  it('does not redirect when mustChangePassword is false, regardless of provider', async() => {
    const store = makeStore({
      user:       { mustChangePassword: false, principalIds: ['local://user-1'] },
      fromHeader: 'true',
    });

    findMeMock.mockResolvedValue({ id: 'local://user-1', provider: 'local' });

    const next = jest.fn();

    await authenticate(to as any, {} as any, next, { store } as any);

    expect(next).toHaveBeenCalledWith();
    expect(isLoggedInMock).toHaveBeenCalledTimes(1);
  });

  it('redirects local users with mustChangePassword to auth-setup for older-style fromHeader', async() => {
    const store = makeStore({
      user:       { mustChangePassword: true, principalIds: ['local://user-1'] },
      fromHeader: 'unknown',
    });

    findMeMock.mockResolvedValue({ id: 'local://user-1', provider: 'local' });

    const next = jest.fn();

    await authenticate(to as any, {} as any, next, { store } as any);

    expect(next).toHaveBeenCalledWith({ name: 'auth-setup' });
    expect(isLoggedInMock).not.toHaveBeenCalled();
  });

  it('lets SSO users with mustChangePassword through for older-style fromHeader', async() => {
    const me = { id: 'saml_user://user', provider: 'saml' };
    const store = makeStore({
      user:       { mustChangePassword: true, principalIds: ['local://user-1', me.id] },
      fromHeader: 'unknown',
    });

    findMeMock.mockResolvedValue(me);

    const next = jest.fn();

    await authenticate(to as any, {} as any, next, { store } as any);

    expect(next).toHaveBeenCalledWith();
    expect(next).not.toHaveBeenCalledWith({ name: 'auth-setup' });
    expect(isLoggedInMock).toHaveBeenCalledTimes(1);
  });
});

describe('navigation-guards/authentication: authRedirect', () => {
  beforeEach(() => {
    isLoggedInMock.mockReset().mockResolvedValue(undefined);
    findMeMock.mockReset().mockResolvedValue({ id: 'local://user-1', provider: 'local' });
    notLoggedInMock.mockReset();
    noAuthMock.mockReset();
  });

  it.each([
    {
      desc:                        'a logged-in load of a page clears the page saved before login',
      routeName:                   'c-cluster-explorer',
      expectedAuthRedirectCommits: [['prefs/setAuthRedirect', null]],
    },
    {
      desc:                        'a logged-in load of the index route leaves the page saved before login for index.vue',
      routeName:                   'index',
      expectedAuthRedirectCommits: [],
    },
  ])('$desc', async({ routeName, expectedAuthRedirectCommits }) => {
    const store = makeStore({ user: { mustChangePassword: false }, fromHeader: 'true' });
    const next = jest.fn();

    await authenticate({ name: routeName, query: {} } as any, {} as any, next, { store } as any);

    const authRedirectCommits = store.commit.mock.calls.filter(([type]) => type === 'prefs/setAuthRedirect');

    expect(authRedirectCommits).toStrictEqual(expectedAuthRedirectCommits);
    expect(next).toHaveBeenCalledWith();
  });

  it('leaves the page saved before login to notLoggedIn on a load that is not logged in', async() => {
    const store = makeStore({ user: {}, fromHeader: 'false' });
    const next = jest.fn();

    await authenticate(to as any, {} as any, next, { store } as any);

    expect(notLoggedInMock).toHaveBeenCalledWith(store, next, to);
    expect(store.commit).not.toHaveBeenCalledWith('prefs/setAuthRedirect', null);
  });
});
