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

    findMeMock.mockResolvedValue({ id: 'local://user-1' });

    const next = jest.fn();

    await authenticate(to as any, {} as any, next, { store } as any);

    expect(next).toHaveBeenCalledWith({ name: 'auth-setup' });
    expect(isLoggedInMock).not.toHaveBeenCalled();
  });

  it('lets SSO users with mustChangePassword reach the requested route', async() => {
    const me = { id: 'oidc_user://user@example.com' };
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

    findMeMock.mockResolvedValue({ id: 'local://user-1' });

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

    findMeMock.mockResolvedValue({ id: 'local://user-1' });

    const next = jest.fn();

    await authenticate(to as any, {} as any, next, { store } as any);

    expect(next).toHaveBeenCalledWith({ name: 'auth-setup' });
    expect(isLoggedInMock).not.toHaveBeenCalled();
  });

  it('lets SSO users with mustChangePassword through for older-style fromHeader', async() => {
    const me = { id: 'saml_user://user' };
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
