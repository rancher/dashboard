import {
  checkPermissions,
  parseAuthProvidersInfo,
  returnTo,
} from '@shell/utils/auth';

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
