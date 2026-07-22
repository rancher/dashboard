import {
  checkPermissions,
  parseAuthProvidersInfo,
  returnTo,
  checkSchemasForFindAllHash,
  canViewResource,
  authProvidersInfo,
  findMe,
  noAuth,
  notLoggedIn,
  isLoggedIn,
  tryInitialSetup,
} from '@shell/utils/auth';
import { onExtensionsReady } from '@shell/utils/uiplugins';

jest.mock('@shell/utils/uiplugins', () => ({ onExtensionsReady: jest.fn().mockResolvedValue(undefined) }));

const mockOnExtensionsReady = onExtensionsReady as jest.Mock;

describe('parseAuthProvidersInfo', () => {
  it.each([
    {
      desc:     'empty rows',
      rows:     [],
      expected: {
        nonLocal:        [],
        enabled:         [],
        enabledLocation: null,
      },
    },
    {
      desc: 'only local provider',
      rows: [{
        name: 'local', id: 'local', enabled: true
      }],
      expected: {
        nonLocal:        [],
        enabled:         [],
        enabledLocation: null,
      },
    },
    {
      desc: 'one disabled non-local provider',
      rows: [{
        name: 'github', id: 'github', enabled: false
      }],
      expected: {
        nonLocal: [{
          name: 'github', id: 'github', enabled: false
        }],
        enabled:         [],
        enabledLocation: null,
      },
    },
    {
      desc: 'one enabled non-local provider',
      rows: [{
        name: 'github', id: 'github', enabled: true
      }],
      expected: {
        nonLocal: [{
          name: 'github', id: 'github', enabled: true
        }],
        enabled: [{
          name: 'github', id: 'github', enabled: true
        }],
        enabledLocation: {
          name:   'c-cluster-auth-config-id',
          params: { id: 'github' },
          query:  { mode: 'edit' },
        },
      },
    },
    {
      desc: 'oidc provider excluded from nonLocal but included in enabled',
      rows: [{
        name: 'oidc', id: 'oidc', enabled: true
      }],
      expected: {
        nonLocal: [],
        enabled:  [{
          name: 'oidc', id: 'oidc', enabled: true
        }],
        enabledLocation: {
          name:   'c-cluster-auth-config-id',
          params: { id: 'oidc' },
          query:  { mode: 'edit' },
        },
      },
    },
    {
      desc: 'two enabled non-local providers gives null enabledLocation',
      rows: [
        {
          name: 'github', id: 'github', enabled: true
        },
        {
          name: 'activedirectory', id: 'activedirectory', enabled: true
        },
      ],
      expected: {
        nonLocal: [
          {
            name: 'github', id: 'github', enabled: true
          },
          {
            name: 'activedirectory', id: 'activedirectory', enabled: true
          },
        ],
        enabled: [
          {
            name: 'github', id: 'github', enabled: true
          },
          {
            name: 'activedirectory', id: 'activedirectory', enabled: true
          },
        ],
        enabledLocation: null,
      },
    },
    {
      desc: 'local provider excluded while non-local disabled provider is retained',
      rows: [
        {
          name: 'local', id: 'local', enabled: true
        },
        {
          name: 'github', id: 'github', enabled: false
        },
      ],
      expected: {
        nonLocal: [{
          name: 'github', id: 'github', enabled: false
        }],
        enabled:         [],
        enabledLocation: null,
      },
    },
  ])('returns provider info for $desc', ({ rows, expected }) => {
    expect(parseAuthProvidersInfo(rows)).toStrictEqual(expected);
  });
});

describe('checkPermissions', () => {
  it('returns empty object for empty types', async() => {
    const getters = { 'management/schemaFor': jest.fn() };
    const result = await checkPermissions({}, getters);

    expect(result).toStrictEqual({});
  });

  it('returns false when schema is not found', async() => {
    const getters = { 'management/schemaFor': jest.fn().mockReturnValue(null) };
    const result = await checkPermissions({ pods: { type: 'pod' } }, getters);

    expect(result).toStrictEqual({ pods: false });
    expect(getters['management/schemaFor']).toHaveBeenCalledWith('pod');
  });

  it('returns true when schema exists with no method constraints', async() => {
    const mockSchema = { resourceMethods: ['GET', 'PUT'] };
    const getters = { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) };
    const result = await checkPermissions({ pods: { type: 'pod' } }, getters);

    expect(result).toStrictEqual({ pods: true });
  });

  it('uses schemaValidator result when provided', async() => {
    const mockSchema = { resourceMethods: ['GET'] };
    const schemaValidator = jest.fn().mockReturnValue(false);
    const getters = { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) };
    const result = await checkPermissions({ pods: { type: 'pod', schemaValidator } }, getters);

    expect(result).toStrictEqual({ pods: false });
    expect(schemaValidator).toHaveBeenCalledWith(mockSchema);
  });

  it('returns true when all resourceMethods are available', async() => {
    const mockSchema = { resourceMethods: ['GET', 'PUT', 'DELETE'] };
    const getters = { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) };
    const types = { pods: { type: 'pod', resourceMethods: ['GET', 'PUT'] } };
    const result = await checkPermissions(types, getters);

    expect(result).toStrictEqual({ pods: true });
  });

  it('returns false when a resourceMethod is not in schema', async() => {
    const mockSchema = { resourceMethods: ['GET'] };
    const getters = { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) };
    const types = { pods: { type: 'pod', resourceMethods: ['GET', 'DELETE'] } };
    const result = await checkPermissions(types, getters);

    expect(result).toStrictEqual({ pods: false });
  });

  it('returns false when schema has no resourceMethods and type requires them', async() => {
    const mockSchema = {};
    const getters = { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) };
    const types = { pods: { type: 'pod', resourceMethods: ['GET'] } };
    const result = await checkPermissions(types, getters);

    expect(result).toStrictEqual({ pods: false });
  });

  it('returns true when all collectionMethods are available', async() => {
    const mockSchema = { collectionMethods: ['GET', 'POST'] };
    const getters = { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) };
    const types = { pods: { type: 'pod', collectionMethods: ['GET'] } };
    const result = await checkPermissions(types, getters);

    expect(result).toStrictEqual({ pods: true });
  });

  it('returns false when a collectionMethod is not in schema', async() => {
    const mockSchema = { collectionMethods: ['GET'] };
    const getters = { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) };
    const types = { pods: { type: 'pod', collectionMethods: ['GET', 'DELETE'] } };
    const result = await checkPermissions(types, getters);

    expect(result).toStrictEqual({ pods: false });
  });

  it('handles multiple types independently', async() => {
    const getters = {
      'management/schemaFor': jest.fn()
        .mockReturnValueOnce({ resourceMethods: ['GET'] })
        .mockReturnValueOnce(null),
    };
    const types = {
      pods:  { type: 'pod' },
      nodes: { type: 'node' },
    };
    const result = await checkPermissions(types, getters);

    expect(result).toStrictEqual({ pods: true, nodes: false });
  });
});

describe('returnTo', () => {
  it.each([
    {
      desc:     'default route when no route in opt',
      opt:      {},
      vm:       { $router: {} },
      expected: 'http://localhost/auth/verify',
    },
    {
      desc:     'custom route from opt',
      opt:      { route: '/my/page' },
      vm:       { $router: {} },
      expected: 'http://localhost/my/page',
    },
    {
      desc:     'router base prepended to route',
      opt:      {},
      vm:       { $router: { options: { base: '/ui' } } },
      expected: 'http://localhost/ui/auth/verify',
    },
    {
      desc:     'router base of "/" does not alter route',
      opt:      {},
      vm:       { $router: { options: { base: '/' } } },
      expected: 'http://localhost/auth/verify',
    },
    {
      desc:     'backTo option adds back-to query param',
      opt:      { backTo: 'dashboard' },
      vm:       { $router: {} },
      expected: 'http://localhost/auth/verify?back-to=dashboard',
    },
    {
      desc:     'config option adds config query param',
      opt:      { config: 'github' },
      vm:       { $router: {} },
      expected: 'http://localhost/auth/verify?config=github',
    },
    {
      desc:     'isSlo option adds is-slo and logged-out params',
      opt:      { isSlo: true },
      vm:       { $router: {} },
      expected: 'http://localhost/auth/verify?is-slo&logged-out',
    },
  ])('builds return URL for $desc', ({ opt, vm, expected }) => {
    expect(returnTo(opt, vm)).toStrictEqual(expected);
  });
});

describe('checkSchemasForFindAllHash', () => {
  it('returns empty result for empty types', async() => {
    const store = {
      getters:  {},
      dispatch: jest.fn(),
    };
    const result = await checkSchemasForFindAllHash({}, store);

    expect(result).toStrictEqual({});
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('skips dispatch when schema is not found', async() => {
    const schemaFor = jest.fn().mockReturnValue(null);
    const store = {
      getters:  { 'management/schemaFor': schemaFor },
      dispatch: jest.fn().mockResolvedValue([]),
    };
    const types = { pods: { inStoreType: 'management', type: 'pod' } };

    const result = await checkSchemasForFindAllHash(types, store);

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(result).toStrictEqual({});
  });

  it('dispatches findAll and returns result when schema is found', async() => {
    const schemaFor = jest.fn().mockReturnValue({ id: 'pod' });
    const store = {
      getters:  { 'management/schemaFor': schemaFor },
      dispatch: jest.fn().mockResolvedValue([{ id: 'pod-1' }]),
    };
    const types = { pods: { inStoreType: 'management', type: 'pod' } };

    const result = await checkSchemasForFindAllHash(types, store);

    expect(store.dispatch).toHaveBeenCalledWith('management/findAll', { type: 'pod', opt: undefined });
    expect(result).toStrictEqual({ pods: [{ id: 'pod-1' }] });
  });

  it('dispatches but excludes from hash when skipWait is true', async() => {
    const schemaFor = jest.fn().mockReturnValue({ id: 'pod' });
    const store = {
      getters:  { 'management/schemaFor': schemaFor },
      dispatch: jest.fn().mockResolvedValue([{ id: 'pod-1' }]),
    };
    const types = {
      pods: {
        inStoreType: 'management', type: 'pod', skipWait: true
      }
    };

    const result = await checkSchemasForFindAllHash(types, store);

    expect(store.dispatch).toHaveBeenCalled();
    expect(result).toStrictEqual({});
  });

  it('skips dispatch when schemaValidator returns false', async() => {
    const schemaFor = jest.fn().mockReturnValue({ id: 'pod' });
    const schemaValidator = jest.fn().mockReturnValue(false);
    const store = {
      getters:  { 'management/schemaFor': schemaFor },
      dispatch: jest.fn(),
    };
    const types = {
      pods: {
        inStoreType: 'management', type: 'pod', schemaValidator
      }
    };

    const result = await checkSchemasForFindAllHash(types, store);

    expect(schemaValidator).toHaveBeenCalledWith({ id: 'pod' });
    expect(store.dispatch).not.toHaveBeenCalled();
    expect(result).toStrictEqual({});
  });

  it('dispatches when schemaValidator returns true', async() => {
    const schemaFor = jest.fn().mockReturnValue({ id: 'pod' });
    const schemaValidator = jest.fn().mockReturnValue(true);
    const store = {
      getters:  { 'management/schemaFor': schemaFor },
      dispatch: jest.fn().mockResolvedValue(['result']),
    };
    const types = {
      pods: {
        inStoreType: 'management', type: 'pod', schemaValidator
      }
    };

    await checkSchemasForFindAllHash(types, store);

    expect(store.dispatch).toHaveBeenCalledWith('management/findAll', { type: 'pod', opt: undefined });
  });

  it('handles multiple types independently, only dispatching for valid schemas', async() => {
    const schemaFor = jest.fn()
      .mockReturnValueOnce({ id: 'pod' })
      .mockReturnValueOnce(null);
    const store = {
      getters:  { 'management/schemaFor': schemaFor },
      dispatch: jest.fn().mockResolvedValue([]),
    };
    const types = {
      pods:  { inStoreType: 'management', type: 'pod' },
      nodes: { inStoreType: 'management', type: 'node' },
    };

    const result = await checkSchemasForFindAllHash(types, store);

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith('management/findAll', { type: 'pod', opt: undefined });
    expect(result).toStrictEqual({ pods: [] });
  });
});

describe('canViewResource', () => {
  it('returns false when currentStore returns falsy', () => {
    const store = { getters: { currentStore: jest.fn().mockReturnValue(null) } };

    expect(canViewResource(store, 'pod')).toStrictEqual(false);
  });

  it('returns false when schemaFor getter is undefined in store', () => {
    const store = { getters: { currentStore: jest.fn().mockReturnValue('management') } };

    expect(canViewResource(store, 'pod')).toStrictEqual(false);
  });

  it('returns true when schema exists for resource', () => {
    const schemaFor = jest.fn().mockReturnValue({ id: 'pod' });
    const store = {
      getters: {
        currentStore:           jest.fn().mockReturnValue('management'),
        'management/schemaFor': schemaFor,
        'type-map/isVirtual':   jest.fn().mockReturnValue(false),
      },
    };

    expect(canViewResource(store, 'pod')).toStrictEqual(true);
    expect(schemaFor).toHaveBeenCalledWith('pod');
  });

  it('returns true when resource is virtual even with no schema', () => {
    const schemaFor = jest.fn().mockReturnValue(null);
    const store = {
      getters: {
        currentStore:           jest.fn().mockReturnValue('management'),
        'management/schemaFor': schemaFor,
        'type-map/isVirtual':   jest.fn().mockReturnValue(true),
      },
    };

    expect(canViewResource(store, 'virtual-type')).toStrictEqual(true);
  });

  it('returns false when no schema and resource is not virtual', () => {
    const schemaFor = jest.fn().mockReturnValue(null);
    const store = {
      getters: {
        currentStore:           jest.fn().mockReturnValue('management'),
        'management/schemaFor': schemaFor,
        'type-map/isVirtual':   jest.fn().mockReturnValue(false),
      },
    };

    expect(canViewResource(store, 'unknown-type')).toStrictEqual(false);
  });
});

describe('authProvidersInfo', () => {
  it('returns parsed provider info on dispatch success', async() => {
    const rows = [{
      name: 'github', id: 'github', enabled: true
    }];
    const store = { dispatch: jest.fn().mockResolvedValue(rows) };

    const result = await authProvidersInfo(store);

    expect(store.dispatch).toHaveBeenCalledWith('management/findAll', { type: 'management.cattle.io.authconfig' });
    expect(result).toStrictEqual({
      nonLocal: [{
        name: 'github', id: 'github', enabled: true
      }],
      enabled: [{
        name: 'github', id: 'github', enabled: true
      }],
      enabledLocation: {
        name:   'c-cluster-auth-config-id',
        params: { id: 'github' },
        query:  { mode: 'edit' },
      },
    });
  });

  it('returns empty object when dispatch throws', async() => {
    const store = { dispatch: jest.fn().mockRejectedValue(new Error('server error')) };

    const result = await authProvidersInfo(store);

    expect(result).toStrictEqual({});
  });
});

describe('findMe', () => {
  it('returns the principal with me=true from the list', async() => {
    const principals = [
      { id: 'user-1', me: false },
      { id: 'user-2', me: true },
    ];
    const store = { dispatch: jest.fn().mockResolvedValue(principals) };

    const result = await findMe(store);

    expect(result).toStrictEqual({ id: 'user-2', me: true });
    expect(store.dispatch).toHaveBeenCalledWith('rancher/findAll', {
      type: 'principal',
      opt:  {
        url:                  '/v3/principals',
        redirectUnauthorized: false,
      },
    });
  });

  it('returns undefined when no principal has me=true', async() => {
    const store = { dispatch: jest.fn().mockResolvedValue([{ id: 'user-1', me: false }]) };

    const result = await findMe(store);

    expect(result).toStrictEqual(undefined);
  });
});

describe('noAuth', () => {
  it('commits auth/hasAuth as false', () => {
    const store = { commit: jest.fn() };

    noAuth(store);

    expect(store.commit).toHaveBeenCalledWith('auth/hasAuth', false);
  });
});

describe('notLoggedIn', () => {
  it.each([
    {
      desc:                  'index route redirects to /auth/login and sets authRedirect',
      routeName:             'index',
      expectedRedirect:      '/auth/login',
      authRedirectCallCount: 1,
    },
    {
      desc:                  'non-auth non-index route redirects with timed-out and sets authRedirect',
      routeName:             'dashboard',
      expectedRedirect:      '/auth/login?timed-out',
      authRedirectCallCount: 1,
    },
    {
      desc:                  'auth route redirects with timed-out but skips authRedirect',
      routeName:             'auth-login',
      expectedRedirect:      '/auth/login?timed-out',
      authRedirectCallCount: 0,
    },
  ])('$desc', ({ routeName, expectedRedirect, authRedirectCallCount }) => {
    const store = { commit: jest.fn() };
    const redirect = jest.fn();
    const route = { name: routeName };

    notLoggedIn(store, redirect, route);

    expect(store.commit).toHaveBeenCalledWith('auth/hasAuth', true);
    expect(redirect).toHaveBeenCalledWith(expectedRedirect);

    const setAuthRedirectCalls = store.commit.mock.calls.filter((call) => call[0] === 'prefs/setAuthRedirect');

    expect(setAuthRedirectCalls.length).toStrictEqual(authRedirectCallCount);
  });
});

describe('isLoggedIn', () => {
  it('commits hasAuth, dispatches loggedInAs and notifications/init, then calls onExtensionsReady', async() => {
    const store = {
      commit:   jest.fn(),
      dispatch: jest.fn().mockResolvedValue(undefined),
    };
    const userData = { id: 'user-42' };

    mockOnExtensionsReady.mockResolvedValue(undefined);

    await isLoggedIn(store, userData);

    expect(store.commit).toHaveBeenCalledWith('auth/hasAuth', true);
    expect(store.dispatch).toHaveBeenCalledWith('auth/loggedInAs', 'user-42');
    expect(store.dispatch).toHaveBeenCalledWith('notifications/init', userData);
    expect(mockOnExtensionsReady).toHaveBeenCalledWith(store);
  });
});

describe('tryInitialSetup', () => {
  it('returns true when login dispatch resolves with status 200', async() => {
    const store = { dispatch: jest.fn().mockResolvedValue({ _status: 200 }) };

    const result = await tryInitialSetup(store);

    expect(result).toStrictEqual(true);
    expect(store.dispatch).toHaveBeenCalledWith('auth/login', {
      provider: 'local',
      body:     {
        username: 'admin',
        password: 'admin',
      },
    });
  });

  it('returns false when login dispatch resolves with non-200 status', async() => {
    const store = { dispatch: jest.fn().mockResolvedValue({ _status: 401 }) };

    const result = await tryInitialSetup(store);

    expect(result).toStrictEqual(false);
  });

  it('returns false when login dispatch throws', async() => {
    const store = { dispatch: jest.fn().mockRejectedValue(new Error('network error')) };

    const result = await tryInitialSetup(store);

    expect(result).toStrictEqual(false);
  });

  it('uses provided password instead of default', async() => {
    const store = { dispatch: jest.fn().mockResolvedValue({ _status: 200 }) };

    await tryInitialSetup(store, 'custom-pass');

    expect(store.dispatch).toHaveBeenCalledWith('auth/login', {
      provider: 'local',
      body:     {
        username: 'admin',
        password: 'custom-pass',
      },
    });
  });
});
