import {
  checkPermissions,
  returnTo,
  checkSchemasForFindAllHash,
  canViewResource,
  findMe,
  noAuth,
  notLoggedIn,
  isLoggedIn,
  tryInitialSetup,
  isLastWayIn,
  canWriteLocalAuthFeature,
  restoreLocalLogin,
  promptDisableAuthProvider,
} from '@shell/utils/auth';
import { onExtensionsReady } from '@shell/utils/uiplugins';

jest.mock('@shell/utils/uiplugins', () => ({ onExtensionsReady: jest.fn().mockResolvedValue(undefined) }));

const mockOnExtensionsReady = onExtensionsReady as jest.Mock;

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

describe('fx: isLastWayIn', () => {
  const local = { id: 'local', enabled: true };
  const github = { id: 'github', enabled: true };
  const okta = { id: 'okta', enabled: true };

  // Local login being on is the whole safety net -- with it there is always an
  // account left to sign in with, whatever happens to the external providers.
  it('should be false while local login is on, even for the only provider', () => {
    expect(isLastWayIn([local, github], 'github', false)).toBe(false);
  });

  it('should be true for the only enabled external provider once local login is off', () => {
    expect(isLastWayIn([local, github], 'github', true)).toBe(true);
  });

  it('should be false while another external provider is still enabled', () => {
    expect(isLastWayIn([local, github, okta], 'github', true)).toBe(false);
  });

  // A disabled provider is no more use than a missing one.
  it('should not count a disabled provider as a way in', () => {
    expect(isLastWayIn([local, github, { id: 'okta', enabled: false }], 'github', true)).toBe(true);
  });

  // The local authconfig is enabled even when the flag hides it from the login
  // screen, so it must not be mistaken for a surviving provider.
  it('should not count the local config as an external provider', () => {
    expect(isLastWayIn([local], 'github', true)).toBe(true);
  });

  it.each([
    ['no configs at all', []],
    ['nothing passed', undefined],
  ] as [string, any[] | undefined][])('should treat %s as the last way in', (_desc, configs) => {
    expect(isLastWayIn(configs as any, 'github', true)).toBe(true);
  });
});

describe('fx: canWriteLocalAuthFeature', () => {
  const makeGetters = ({ methods = ['GET', 'PUT'], feature = { status: { lockedValue: null } } }: any = {}) => ({
    'management/schemaFor': () => ({ resourceMethods: methods }),
    'management/byId':      () => feature,
  } as any);

  it('should allow the write when the schema permits it and nothing is locked', () => {
    expect(canWriteLocalAuthFeature(makeGetters())).toBe(true);
  });

  it('should refuse without PUT on the feature schema', () => {
    expect(canWriteLocalAuthFeature(makeGetters({ methods: ['GET'] }))).toBe(false);
  });

  // An install can pin the flag, and the API rejects any write to it.
  it.each([true, false])('should refuse when the value is locked to %p', (lockedValue) => {
    expect(canWriteLocalAuthFeature(makeGetters({ feature: { status: { lockedValue } } }))).toBe(false);
  });

  it('should refuse when the feature is not in the store', () => {
    expect(canWriteLocalAuthFeature(makeGetters({ feature: null }))).toBe(false);
  });

  it('should refuse rather than throw when there is no feature schema', () => {
    expect(canWriteLocalAuthFeature({ 'management/schemaFor': () => undefined, 'management/byId': () => null } as any)).toBe(false);
  });
});

describe('fx: restoreLocalLogin', () => {
  const makeFeature = (save: any) => ({
    spec: { value: true }, status: { lockedValue: null }, save
  });

  it('should switch the flag off and save it', async() => {
    const feature = makeFeature(jest.fn().mockResolvedValue(undefined));

    await restoreLocalLogin({ 'management/byId': () => feature } as any);

    expect(feature.spec.value).toBe(false);
    expect(feature.save).toHaveBeenCalledWith();
  });

  // Leaving the resource looking saved would have the list claim local login is
  // back on when it is not.
  it('should roll the flag back and rethrow when the save fails', async() => {
    const err = new Error('Forbidden');
    const feature = makeFeature(jest.fn().mockRejectedValue(err));

    await expect(restoreLocalLogin({ 'management/byId': () => feature } as any)).rejects.toThrow(err);

    expect(feature.spec.value).toBe(true);
  });

  it('should do nothing rather than throw when the feature is missing', async() => {
    await expect(restoreLocalLogin({ 'management/byId': () => null } as any)).resolves.toBeUndefined();
  });
});

describe('fx: promptDisableAuthProvider', () => {
  const makeArgs = ({ configs = [], localLoginDisabled = false }: any = {}) => {
    const dispatch = jest.fn((action: string) => (action === 'management/findAll' ? Promise.resolve(configs) : Promise.resolve()));

    const getters = {
      'features/get':         () => localLoginDisabled,
      'management/schemaFor': () => ({ resourceMethods: ['PUT'] }),
      'management/byId':      () => ({ spec: { value: true }, status: { lockedValue: null } }),
    } as any;

    return {
      dispatch, getters, id: 'github', name: 'GitHub', disableCb: jest.fn()
    };
  };

  const modalArgs = (dispatch: jest.Mock) => (dispatch.mock.calls.find(([action]) => action === 'management/promptModal') as any[])[1];

  it('should open the ordinary dialog while local login is on', async() => {
    const args = makeArgs({ configs: [{ id: 'github', enabled: true }] });

    await promptDisableAuthProvider(args);

    expect(modalArgs(args.dispatch).component).toBe('DisableAuthProviderDialog');
    expect(modalArgs(args.dispatch).componentProps.disableCb).toBe(args.disableCb);
  });

  it('should open the lockout dialog for the last provider with local login off', async() => {
    const args = makeArgs({ configs: [{ id: 'github', enabled: true }], localLoginDisabled: true });

    await promptDisableAuthProvider(args);

    expect(modalArgs(args.dispatch).component).toBe('DisableLastAuthProviderDialog');
  });

  // The provider list is read fresh rather than taken from the caller, because
  // another provider may have been enabled since the page loaded.
  it('should read the providers before choosing a dialog', async() => {
    const args = makeArgs();

    await promptDisableAuthProvider(args);

    expect(args.dispatch.mock.calls[0][0]).toBe('management/findAll');
  });

  it('should tell the lockout dialog whether local login can be switched back on', async() => {
    const args = makeArgs({ configs: [{ id: 'github', enabled: true }], localLoginDisabled: true });

    args.getters['management/schemaFor'] = () => ({ resourceMethods: ['GET'] });

    await promptDisableAuthProvider(args);

    expect(modalArgs(args.dispatch).componentProps.canRestore).toBe(false);
  });

  // Not knowing has to count as the last provider: wrongly blocking costs a step,
  // wrongly allowing locks everyone out with only command-line recovery.
  it('should block when the providers cannot be read and local login is off', async() => {
    const args = makeArgs({ localLoginDisabled: true });

    args.dispatch.mockImplementation((action: string) => (action === 'management/findAll' ? Promise.reject(new Error('nope')) : Promise.resolve()));

    await promptDisableAuthProvider(args);

    expect(modalArgs(args.dispatch).component).toBe('DisableLastAuthProviderDialog');
  });

  // With local login on there is still an account to sign in with, so a read
  // failure is no reason to stand in the way.
  it('should not block on a read failure while local login is on', async() => {
    const args = makeArgs();

    args.dispatch.mockImplementation((action: string) => (action === 'management/findAll' ? Promise.reject(new Error('nope')) : Promise.resolve()));

    await promptDisableAuthProvider(args);

    expect(modalArgs(args.dispatch).component).toBe('DisableAuthProviderDialog');
  });

  // `findAll` resolves to undefined against a store that has nothing cached.
  it('should not throw when the provider list comes back empty', async() => {
    const args = makeArgs();

    args.dispatch.mockImplementation(() => Promise.resolve(undefined));

    await expect(promptDisableAuthProvider(args)).resolves.toBeUndefined();

    expect(modalArgs(args.dispatch).component).toBe('DisableAuthProviderDialog');
  });

  // AppModal drops a width carrying no unit and falls back to its own default.
  it.each([
    ['ordinary', false],
    ['lockout', true],
  ])('should ask the %s dialog for a width the modal can use', async(_desc, localLoginDisabled) => {
    const args = makeArgs({ configs: [{ id: 'github', enabled: true }], localLoginDisabled });

    await promptDisableAuthProvider(args);

    expect(modalArgs(args.dispatch).modalWidth).toMatch(/(px|%)$/);
  });
});
