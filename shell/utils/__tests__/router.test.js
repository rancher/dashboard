import { findRouteDefinitionByName, filterLocationValidParams } from '@shell/utils/router';

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
