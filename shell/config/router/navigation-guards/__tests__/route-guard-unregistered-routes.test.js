import routes from '@shell/config/router/routes';
import { handleRouteGuardUnregisteredRoutes } from '@shell/config/router/navigation-guards/route-guard-unregistered-routes';

// Flatten the nested routes array
const flattenRoutes = (records, acc = []) => {
  records.forEach((route) => {
    acc.push(route);
    if (route.children?.length) {
      flattenRoutes(route.children, acc);
    }
  });

  return acc;
};

const registeredRoutes = flattenRoutes(routes).filter((r) => !!r.name);

// Build an allTypes map keyed by resource name with matching route names
const allTypes = registeredRoutes.reduce((acc, route) => {
  acc[route.name] = { route: { name: route.name } };

  return acc;
}, {});

// Store mock that returns the allTypes for any product
const store = { getters: { 'type-map/allTypes': jest.fn(() => ({ all: allTypes })) } };

describe('route-guard-unregistered-routes', () => {
  it('does not redirect registered routes', async() => {
    for (const route of registeredRoutes) {
      const next = jest.fn();

      await handleRouteGuardUnregisteredRoutes(
        {
          name:   route.name,
          params: { product: 'test-product', resource: route.name },
        },
        {},
        next,
        { store }
      );

      expect(next).not.toHaveBeenCalledWith(expect.objectContaining({ name: '404' }));
    }
  });

  it('redirects to 404 for an unregistered route/resource with product and resource', async() => {
    const next = jest.fn();

    await handleRouteGuardUnregisteredRoutes(
      {
        name:   'not-registered',
        params: { product: 'test-product', resource: 'not-registered' },
      },
      {},
      next,
      { store }
    );

    expect(next).toHaveBeenCalledWith({ name: '404' });
  });

  it('redirects to 404 for an unregistered route/resource with product', async() => {
    const next = jest.fn();

    await handleRouteGuardUnregisteredRoutes(
      {
        name:   'not-registered',
        params: { product: 'test-product' },
      },
      {},
      next,
      { store }
    );

    expect(next).toHaveBeenCalledWith({ name: '404' });
  });
});
