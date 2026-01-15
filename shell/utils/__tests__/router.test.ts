import {
  queryParamsFor,
  getClusterFromRoute,
  getProductFromRoute,
  getPackageFromRoute,
  getResourceFromRoute,
  routeMatched,
  routeRequiresAuthentication,
  findMeta,
  findRouteDefinitionByName,
  filterLocationValidParams
} from '@shell/utils/router';

describe('fx: queryParamsFor', () => {
  it('should return empty object when no params provided', () => {
    const result = queryParamsFor({}, {});

    expect(result).toStrictEqual({});
  });

  it('should add new params to current query', () => {
    const result = queryParamsFor({ existing: 'value' }, { newKey: 'newValue' });

    expect(result).toStrictEqual({ existing: 'value', newKey: 'newValue' });
  });

  it('should remove param when value equals default', () => {
    const result = queryParamsFor(
      { key: 'default' },
      { key: 'default' },
      { key: 'default' }
    );

    expect(result.key).toBeUndefined();
  });

  it('should keep param when value differs from default', () => {
    const result = queryParamsFor(
      { key: 'default' },
      { key: 'newValue' },
      { key: 'default' }
    );

    expect(result.key).toBe('newValue');
  });

  it('should handle boolean flags with false default', () => {
    const result = queryParamsFor(
      {},
      { flag: true },
      { flag: false }
    );

    expect(result.flag).toBeNull();
  });

  it('should remove boolean flag when value is falsy', () => {
    const result = queryParamsFor(
      { flag: null },
      { flag: false },
      { flag: false }
    );

    expect(result.flag).toBeUndefined();
  });

  it('should handle null current query', () => {
    const result = queryParamsFor(null, { key: 'value' });

    expect(result).toStrictEqual({ key: 'value' });
  });
});

describe('fx: getClusterFromRoute', () => {
  it('should return cluster from route params', () => {
    const route = { params: { cluster: 'my-cluster' } };

    expect(getClusterFromRoute(route)).toBe('my-cluster');
  });

  it('should return cluster from route meta when not in params', () => {
    const route = {
      params: {},
      meta:   [{ cluster: 'meta-cluster' }]
    };

    expect(getClusterFromRoute(route)).toBe('meta-cluster');
  });

  it('should return undefined when no cluster found', () => {
    const route = {
      params: {},
      meta:   []
    };

    expect(getClusterFromRoute(route)).toBeUndefined();
  });
});

describe('fx: getProductFromRoute', () => {
  it('should return product from route params', () => {
    const route = { params: { product: 'explorer' } };

    expect(getProductFromRoute(route)).toBe('explorer');
  });

  it('should extract product from route name pattern', () => {
    const route = {
      params: {},
      name:   'c-cluster-explorer-resource'
    };

    expect(getProductFromRoute(route)).toBe('explorer');
  });

  it('should return product from meta when not in params or name', () => {
    const route = {
      params: {},
      name:   'some-route',
      meta:   [{ product: 'meta-product' }]
    };

    expect(getProductFromRoute(route)).toBe('meta-product');
  });

  it('should return undefined when no product found', () => {
    const route = {
      params: {},
      name:   'other-route',
      meta:   []
    };

    expect(getProductFromRoute(route)).toBeUndefined();
  });
});

describe('fx: getPackageFromRoute', () => {
  it('should return package from route meta', () => {
    const route = { meta: [{ pkg: 'my-package' }] };

    expect(getPackageFromRoute(route)).toBe('my-package');
  });

  it('should handle meta as single object', () => {
    const route = { meta: { pkg: 'single-package' } };

    expect(getPackageFromRoute(route)).toBe('single-package');
  });

  it('should return undefined when no meta', () => {
    const route = {};

    expect(getPackageFromRoute(route)).toBeUndefined();
  });

  it('should return undefined when no pkg in meta', () => {
    const route = { meta: [{ other: 'value' }] };

    expect(getPackageFromRoute(route)).toBeUndefined();
  });
});

describe('fx: getResourceFromRoute', () => {
  it('should return resource from route params', () => {
    const route = { params: { resource: 'pods' } };

    expect(getResourceFromRoute(route)).toBe('pods');
  });

  it('should return resource from meta when not in params', () => {
    const route = {
      params: {},
      meta:   [{ resource: 'deployments' }]
    };

    expect(getResourceFromRoute(route)).toBe('deployments');
  });
});

describe('fx: routeMatched', () => {
  it('should return true when predicate matches a route', () => {
    const route = {
      matched: [
        { name: 'route1' },
        { name: 'route2' }
      ]
    };

    const result = routeMatched(route, (r) => r.name === 'route2');

    expect(result).toBe(true);
  });

  it('should return false when no route matches predicate', () => {
    const route = {
      matched: [
        { name: 'route1' },
        { name: 'route2' }
      ]
    };

    const result = routeMatched(route, (r) => r.name === 'route3');

    expect(result).toBe(false);
  });

  it('should return false when matched is empty', () => {
    const route = { matched: [] };

    const result = routeMatched(route, () => true);

    expect(result).toBe(false);
  });

  it('should handle undefined route', () => {
    const result = routeMatched(undefined, () => true);

    expect(result).toBe(false);
  });
});

describe('fx: routeRequiresAuthentication', () => {
  it('should return true when route requires authentication', () => {
    const route = { matched: [{ meta: { requiresAuthentication: true } }] };

    expect(routeRequiresAuthentication(route)).toBe(true);
  });

  it('should return false when route does not require authentication', () => {
    const route = { matched: [{ meta: { requiresAuthentication: false } }] };

    expect(routeRequiresAuthentication(route)).toBe(false);
  });

  it('should return false when no meta', () => {
    const route = { matched: [{}] };

    expect(routeRequiresAuthentication(route)).toBe(false);
  });
});

describe('fx: findMeta', () => {
  it('should find meta value by key', () => {
    const route = { meta: [{ key: 'value' }] };

    expect(findMeta(route, 'key')).toBe('value');
  });

  it('should handle meta as single object', () => {
    const route = { meta: { key: 'single-value' } };

    expect(findMeta(route, 'key')).toBe('single-value');
  });

  it('should return undefined when key not found', () => {
    const route = { meta: [{ other: 'value' }] };

    expect(findMeta(route, 'key')).toBeUndefined();
  });

  it('should return undefined when no meta', () => {
    const route = {};

    expect(findMeta(route, 'key')).toBeUndefined();
  });

  it('should return first matching value when multiple meta entries', () => {
    const route = {
      meta: [
        { key: 'first' },
        { key: 'second' }
      ]
    };

    expect(findMeta(route, 'key')).toBe('first');
  });
});

describe('fx: findRouteDefinitionByName', () => {
  it('should find route definition by name', () => {
    const mockRouter = {
      getRoutes: jest.fn().mockReturnValue([
        {
          name: 'route1',
          path: '/route1'
        },
        {
          name: 'route2',
          path: '/route2'
        }
      ])
    };

    const result = findRouteDefinitionByName(mockRouter, 'route2');

    expect(result).toStrictEqual({ name: 'route2', path: '/route2' });
  });

  it('should return undefined when route not found', () => {
    const mockRouter = {
      getRoutes: jest.fn().mockReturnValue([
        {
          name: 'route1',
          path: '/route1'
        }
      ])
    };

    const result = findRouteDefinitionByName(mockRouter, 'nonexistent');

    expect(result).toBeUndefined();
  });
});

describe('fx: filterLocationValidParams', () => {
  it('should filter out invalid params', () => {
    const mockRouter = {
      getRoutes: jest.fn().mockReturnValue([
        {
          name: 'test-route',
          path: '/clusters/:cluster/resources/:resource'
        }
      ])
    };

    const routeRecord = {
      name:   'test-route',
      params: {
        cluster:  'my-cluster',
        resource: 'pods',
        invalid:  'should-be-removed'
      }
    };

    const result = filterLocationValidParams(mockRouter, routeRecord);

    expect(result.params).toStrictEqual({ cluster: 'my-cluster', resource: 'pods' });
    expect(result.params.invalid).toBeUndefined();
  });

  it('should return original routeRecord when no params', () => {
    const mockRouter = { getRoutes: jest.fn() };
    const routeRecord = { name: 'test' };

    const result = filterLocationValidParams(mockRouter, routeRecord);

    expect(result).toBe(routeRecord);
  });

  it('should return original routeRecord when no name', () => {
    const mockRouter = { getRoutes: jest.fn() };
    const routeRecord = { params: { foo: 'bar' } };

    const result = filterLocationValidParams(mockRouter, routeRecord);

    expect(result).toBe(routeRecord);
  });

  it('should return original routeRecord when route definition not found', () => {
    const mockRouter = { getRoutes: jest.fn().mockReturnValue([]) };
    const routeRecord = {
      name:   'nonexistent',
      params: { foo: 'bar' }
    };

    const result = filterLocationValidParams(mockRouter, routeRecord);

    expect(result).toBe(routeRecord);
  });

  it('should handle null routeRecord', () => {
    const mockRouter = { getRoutes: jest.fn() };

    const result = filterLocationValidParams(mockRouter, null);

    expect(result).toBeNull();
  });
});
