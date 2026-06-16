import {
  findRouteDefinitionByName,
  filterLocationValidParams,
  queryParamsFor,
  findMeta,
  getClusterFromRoute,
  getProductFromRoute,
  getPackageFromRoute,
  routeMatched,
  routeRequiresAuthentication,
  routeRequiresInstallRedirect,
} from '@shell/utils/router';

describe('findRouteDefinitionByName', () => {
  const createMockRouter = (routes) => ({ getRoutes: () => routes });

  it('should find a route by its name', () => {
    const routes = [
      { name: 'home', path: '/' },
      { name: 'about', path: '/about' },
      { name: 'c-cluster', path: '/c/:cluster' },
    ];
    const router = createMockRouter(routes);

    const result = findRouteDefinitionByName(router, 'about');

    expect(result).toStrictEqual({ name: 'about', path: '/about' });
  });

  it('should return the first matching route when name exists', () => {
    const routes = [
      { name: 'c-cluster-explorer', path: '/c/:cluster/explorer' },
      { name: 'c-cluster-apps', path: '/c/:cluster/apps' },
    ];
    const router = createMockRouter(routes);

    const result = findRouteDefinitionByName(router, 'c-cluster-explorer');

    expect(result).toStrictEqual({ name: 'c-cluster-explorer', path: '/c/:cluster/explorer' });
  });

  it('should return undefined when route name is not found', () => {
    const routes = [
      { name: 'home', path: '/' },
      { name: 'about', path: '/about' },
    ];
    const router = createMockRouter(routes);

    const result = findRouteDefinitionByName(router, 'nonexistent');

    expect(result).toBeUndefined();
  });

  it('should return undefined when routes array is empty', () => {
    const router = createMockRouter([]);

    const result = findRouteDefinitionByName(router, 'any-route');

    expect(result).toBeUndefined();
  });

  it('should handle routes with additional properties', () => {
    const routes = [
      {
        name:  'c-cluster-product-resource',
        path:  '/c/:cluster/:product/:resource',
        meta:  { requiresAuthentication: true },
        props: true,
      },
    ];
    const router = createMockRouter(routes);

    const result = findRouteDefinitionByName(router, 'c-cluster-product-resource');

    expect(result).toStrictEqual(routes[0]);
  });

  it('should match exact route names only', () => {
    const routes = [
      { name: 'c-cluster', path: '/c/:cluster' },
      { name: 'c-cluster-explorer', path: '/c/:cluster/explorer' },
    ];
    const router = createMockRouter(routes);

    const result = findRouteDefinitionByName(router, 'c-cluster');

    expect(result).toStrictEqual({ name: 'c-cluster', path: '/c/:cluster' });
    expect(result.name).not.toBe('c-cluster-explorer');
  });
});

describe('filterLocationValidParams', () => {
  const createMockRouter = (routes) => ({ getRoutes: () => routes });

  it('should filter out params not in route path', () => {
    const routes = [
      { name: 'c-cluster', path: '/c/:cluster' },
    ];
    const router = createMockRouter(routes);
    const routeRecord = {
      name:   'c-cluster',
      params: {
        cluster: 'local',
        product: 'explorer',
      },
    };

    const result = filterLocationValidParams(router, routeRecord);

    expect(result.params).toStrictEqual({ cluster: 'local' });
    expect(result.params.product).toBeUndefined();
  });

  it('should keep all params when all are valid', () => {
    const routes = [
      { name: 'c-cluster-product-resource', path: '/c/:cluster/:product/:resource' },
    ];
    const router = createMockRouter(routes);
    const routeRecord = {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  'local',
        product:  'explorer',
        resource: 'pods',
      },
    };

    const result = filterLocationValidParams(router, routeRecord);

    expect(result.params).toStrictEqual({
      cluster:  'local',
      product:  'explorer',
      resource: 'pods',
    });
  });

  it('should preserve other properties on routeRecord', () => {
    const routes = [
      { name: 'c-cluster', path: '/c/:cluster' },
    ];
    const router = createMockRouter(routes);
    const routeRecord = {
      name:   'c-cluster',
      params: { cluster: 'local' },
      query:  { mode: 'edit' },
      hash:   '#section',
    };

    const result = filterLocationValidParams(router, routeRecord);

    expect(result.query).toStrictEqual({ mode: 'edit' });
    expect(result.hash).toBe('#section');
    expect(result.name).toBe('c-cluster');
  });

  it('should return routeRecord unchanged when routeRecord is null', () => {
    const router = createMockRouter([]);

    const result = filterLocationValidParams(router, null);

    expect(result).toBeNull();
  });

  it('should return routeRecord unchanged when routeRecord is undefined', () => {
    const router = createMockRouter([]);

    const result = filterLocationValidParams(router, undefined);

    expect(result).toBeUndefined();
  });

  it('should return routeRecord unchanged when name is missing', () => {
    const router = createMockRouter([]);
    const routeRecord = { params: { cluster: 'local' } };

    const result = filterLocationValidParams(router, routeRecord);

    expect(result).toStrictEqual(routeRecord);
  });

  it('should return routeRecord unchanged when params is missing', () => {
    const router = createMockRouter([]);
    const routeRecord = { name: 'c-cluster' };

    const result = filterLocationValidParams(router, routeRecord);

    expect(result).toStrictEqual(routeRecord);
  });

  it('should return routeRecord unchanged when route definition is not found', () => {
    const routes = [
      { name: 'home', path: '/' },
    ];
    const router = createMockRouter(routes);
    const routeRecord = {
      name:   'nonexistent-route',
      params: { cluster: 'local' },
    };

    const result = filterLocationValidParams(router, routeRecord);

    expect(result).toStrictEqual(routeRecord);
  });

  it('should return empty params when no params are valid', () => {
    const routes = [
      { name: 'home', path: '/' },
    ];
    const router = createMockRouter(routes);
    const routeRecord = {
      name:   'home',
      params: {
        cluster: 'local',
        product: 'explorer',
      },
    };

    const result = filterLocationValidParams(router, routeRecord);

    expect(result.params).toStrictEqual({});
  });

  it('should handle optional params in path', () => {
    const routes = [
      { name: 'c-cluster-product-resource-id', path: '/c/:cluster/:product/:resource/:id?' },
    ];
    const router = createMockRouter(routes);
    const routeRecord = {
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  'local',
        product:  'explorer',
        resource: 'pods',
        id:       'my-pod',
        extra:    'should-be-removed',
      },
    };

    const result = filterLocationValidParams(router, routeRecord);

    expect(result.params).toStrictEqual({
      cluster:  'local',
      product:  'explorer',
      resource: 'pods',
      id:       'my-pod',
    });
    expect(result.params.extra).toBeUndefined();
  });
});

describe('queryParamsFor', () => {
  it.each([
    {
      desc:     'includes key when no default is defined',
      current:  {},
      qp:       { page: 2 },
      defaults: {},
      expected: { page: 2 },
    },
    {
      desc:     'sets key to null when default is false and val is truthy',
      current:  {},
      qp:       { verbose: true },
      defaults: { verbose: false },
      expected: { verbose: null },
    },
    {
      desc:     'deletes key when default is false and val is falsy',
      current:  { verbose: null },
      qp:       { verbose: false },
      defaults: { verbose: false },
      expected: {},
    },
    {
      desc:     'deletes key when value matches non-false default',
      current:  {},
      qp:       { sort: 'name' },
      defaults: { sort: 'name' },
      expected: {},
    },
    {
      desc:     'sets key when value differs from non-false default',
      current:  {},
      qp:       { sort: 'age' },
      defaults: { sort: 'name' },
      expected: { sort: 'age' },
    },
    {
      desc:     'preserves unrelated keys from current',
      current:  { filter: 'active' },
      qp:       { page: 2 },
      defaults: {},
      expected: { filter: 'active', page: 2 },
    },
    {
      desc:     'treats null current as empty object',
      current:  null,
      qp:       { page: 1 },
      defaults: {},
      expected: { page: 1 },
    },
  ])('$desc', ({
    current, qp, defaults, expected
  }) => {
    expect(queryParamsFor(current, qp, defaults)).toStrictEqual(expected);
  });
});

describe('findMeta', () => {
  it.each([
    {
      desc:     'returns undefined when route has no meta',
      route:    { params: {} },
      key:      'product',
      expected: undefined,
    },
    {
      desc:     'returns undefined when route is null',
      route:    null,
      key:      'product',
      expected: undefined,
    },
    {
      desc:     'returns value from a plain meta object',
      route:    { meta: { product: 'explorer' } },
      key:      'product',
      expected: 'explorer',
    },
    {
      desc:     'returns value from a matching item in array meta',
      route:    { meta: [{ cluster: 'local' }, { product: 'explorer' }] },
      key:      'product',
      expected: 'explorer',
    },
    {
      desc:     'returns undefined when key is absent from all meta items',
      route:    { meta: [{ cluster: 'local' }] },
      key:      'product',
      expected: undefined,
    },
  ])('$desc', ({ route, key, expected }) => {
    expect(findMeta(route, key)).toStrictEqual(expected);
  });
});

describe('getClusterFromRoute', () => {
  it.each([
    {
      desc:     'returns cluster from route params',
      to:       { params: { cluster: 'local' } },
      expected: 'local',
    },
    {
      desc:     'returns cluster from route meta when not in params',
      to:       { params: {}, meta: { cluster: 'remote' } },
      expected: 'remote',
    },
    {
      desc:     'returns undefined when cluster is not in params or meta',
      to:       { params: {} },
      expected: undefined,
    },
  ])('$desc', ({ to, expected }) => {
    expect(getClusterFromRoute(to)).toStrictEqual(expected);
  });
});

describe('getProductFromRoute', () => {
  it.each([
    {
      desc:     'returns product from route params',
      to:       { params: { product: 'explorer' } },
      expected: 'explorer',
    },
    {
      desc:     'infers product segment from c-cluster-<product>-* route name',
      to:       { name: 'c-cluster-explorer-workloads', params: {} },
      expected: 'explorer',
    },
    {
      desc: 'returns product from route meta when params and name do not have it',
      to:   {
        name: 'some-route', params: {}, meta: { product: 'manager' }
      },
      expected: 'manager',
    },
    {
      desc:     'returns undefined when product is not found anywhere',
      to:       { params: {} },
      expected: undefined,
    },
  ])('$desc', ({ to, expected }) => {
    expect(getProductFromRoute(to)).toStrictEqual(expected);
  });
});

describe('getPackageFromRoute', () => {
  it.each([
    {
      desc:     'returns undefined when route has no meta',
      route:    {},
      expected: undefined,
    },
    {
      desc:     'returns pkg from array meta',
      route:    { meta: [{ pkg: 'my-package' }] },
      expected: 'my-package',
    },
    {
      desc:     'returns pkg from plain object meta',
      route:    { meta: { pkg: 'my-package' } },
      expected: 'my-package',
    },
    {
      desc:     'returns undefined when no meta item defines pkg',
      route:    { meta: [{ product: 'explorer' }] },
      expected: undefined,
    },
  ])('$desc', ({ route, expected }) => {
    expect(getPackageFromRoute(route)).toStrictEqual(expected);
  });
});

describe('routeMatched', () => {
  it.each([
    {
      desc:     'returns false when route has no matched array',
      to:       {},
      fn:       (m) => !!m.meta?.test,
      expected: false,
    },
    {
      desc:     'returns true when predicate matches a route entry',
      to:       { matched: [{ meta: { test: true } }] },
      fn:       (m) => !!m.meta?.test,
      expected: true,
    },
    {
      desc:     'returns false when predicate matches no route entry',
      to:       { matched: [{ meta: { other: true } }] },
      fn:       (m) => !!m.meta?.test,
      expected: false,
    },
  ])('$desc', ({ to, fn, expected }) => {
    expect(routeMatched(to, fn)).toStrictEqual(expected);
  });
});

describe('routeRequiresAuthentication', () => {
  it.each([
    {
      desc:     'returns true when a matched route requires authentication',
      to:       { matched: [{ meta: { requiresAuthentication: true } }] },
      expected: true,
    },
    {
      desc:     'returns false when no matched route requires authentication',
      to:       { matched: [{ meta: {} }] },
      expected: false,
    },
    {
      desc:     'returns false when route has no matched array',
      to:       {},
      expected: false,
    },
  ])('$desc', ({ to, expected }) => {
    expect(routeRequiresAuthentication(to)).toStrictEqual(expected);
  });
});

describe('routeRequiresInstallRedirect', () => {
  it.each([
    {
      desc:     'returns true when a matched route meta contains installRedirect',
      to:       { matched: [{ meta: { installRedirect: 'some-product' } }] },
      expected: true,
    },
    {
      desc:     'returns false when no matched route has installRedirect',
      to:       { matched: [{ meta: {} }] },
      expected: false,
    },
    {
      desc:     'returns false when route has no matched array',
      to:       {},
      expected: false,
    },
  ])('$desc', ({ to, expected }) => {
    expect(routeRequiresInstallRedirect(to)).toStrictEqual(expected);
  });
});
