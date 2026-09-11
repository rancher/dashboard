import { createRouter, createMemoryHistory, RouteRecordRaw } from 'vue-router';
import { IExtension, IPlugin } from '@shell/core/types';
import { ExtendingPluginProduct } from '@shell/core/plugin-products-extending';
import { ProductChild } from '@shell/core/plugin-products-external';
import { getProductFromRoute } from '@shell/utils/router';

jest.doMock('@rancher/auto-import', () => ({ importTypes: jest.fn() }), { virtual: true });

jest.mock('@shell/core/productDebugger', () => ({
  DSLRegistrationsPerProduct: jest.fn(),
  registeredRoutes:           jest.fn(),
}));

const STUB = { template: '<div />' };

/**
 * The subset of shell/config/router/routes.js that the extension's own routes compete with.
 * Kept as literal copies of the real paths and names - if those change upstream, this test
 * should be updated alongside them.
 */
const EXPLORER_ROUTES: RouteRecordRaw[] = [
  {
    path: '/c/:cluster/:product/projectsnamespaces', name: 'c-cluster-product-projectsnamespaces', component: STUB
  },
  {
    path: '/c/:cluster/:product/:resource', name: 'c-cluster-product-resource', component: STUB
  },
  {
    path: '/c/:cluster/:product/:resource/create', name: 'c-cluster-product-resource-create', component: STUB
  },
  {
    path: '/c/:cluster/:product/:resource/:id', name: 'c-cluster-product-resource-id', component: STUB
  },
  {
    path: '/c/:cluster/:product/:resource/:namespace/:id', name: 'c-cluster-product-resource-namespace-id', component: STUB
  },
];

/**
 * Collect the routes the extension registers, by running its real config through the real
 * ExtendingPluginProduct and capturing every `addRoute` call.
 */
async function extensionRoutes(): Promise<RouteRecordRaw[]> {
  const extension = await import('../index');
  const routes: RouteRecordRaw[] = [];
  const plugin = {
    extendProduct:              jest.fn(),
    addProduct:                 jest.fn(),
    addRoute:                   jest.fn((route: RouteRecordRaw) => routes.push(route)),
    enableServerSidePagination: jest.fn(),
    DSL:                        jest.fn().mockReturnValue({}),
    register:                   jest.fn(),
    metadata:                   {},
  } as any as IPlugin & IExtension;

  extension.default(plugin);

  const config = (plugin.extendProduct as jest.Mock).mock.calls[0][1] as ProductChild[];

  // Routes are registered from the constructor
  // eslint-disable-next-line no-new
  new ExtendingPluginProduct(plugin, 'explorer', config);

  return routes.map((route) => ({ ...route, component: STUB } as RouteRecordRaw));
}

/**
 * Mirrors the real app: everything hangs off the `default` parent at `/`. Shell routes declare
 * absolute child paths, extension routes declare relative ones - both are valid children.
 */
async function buildRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes:  [{
      path:      '/',
      name:      'default',
      component: STUB,
      children:  [...EXPLORER_ROUTES, ...await extensionRoutes()],
    }],
  });
}

describe('extension: cert-manager routes', () => {
  it('should not collide with the generic explorer route names', async() => {
    const names = [...EXPLORER_ROUTES, ...await extensionRoutes()].map((r) => r.name);

    expect(names).toHaveLength(new Set(names).size);
  });

  it.each([
    ['/c/local/explorer/pod', { cluster: 'local', resource: 'pod' }],
    ['/c/local/explorer/pod/create', { cluster: 'local', resource: 'pod' }],
    ['/c/local/explorer/pod/my-pod', {
      cluster: 'local', resource: 'pod', id: 'my-pod'
    }],
    ['/c/local/explorer/pod/default/my-pod', {
      cluster: 'local', resource: 'pod', namespace: 'default', id: 'my-pod'
    }],
  ])('should still resolve %s with the right params', async(path, expected) => {
    // Extending `explorer` must not register its own `c/:cluster/explorer/:resource` record: a static
    // product segment would outrank the generic `:product` route and shadow the parent's own specific
    // routes. Explorer URLs resolve through the parent core route, and the params must still parse.
    const router = await buildRouter();
    const resolved = router.resolve(path);

    expect(resolved.matched).not.toHaveLength(0);
    expect(resolved.params).toMatchObject(expected);
  });

  it('should resolve explorer resource URLs through the parent core route', async() => {
    // The extension reuses the parent product's generic route, so `params.product` is populated
    // directly and every explorer page keeps its product context.
    const router = await buildRouter();
    const resolved = router.resolve('/c/local/explorer/pod');

    expect(resolved.name).toBe('c-cluster-product-resource');
    expect(resolved.params.product).toBe('explorer');
    expect(getProductFromRoute(resolved)).toBe('explorer');
  });

  it('should not register a per-extension resource route', async() => {
    // Regression: the extension used to add `c-cluster-explorer-resource`. Its static `explorer`
    // segment outranked the core `:product` route, so it captured every explorer URL.
    const names = (await extensionRoutes()).map((r) => r.name);

    expect(names).not.toContain('c-cluster-explorer-resource');
  });

  it('should not shadow the parent product specific virtual-type routes', async() => {
    // Regression: the shadowing route sent `/c/local/explorer/projectsnamespaces` to the generic
    // resource page, which threw "Resource type projectsnamespaces not found".
    const router = await buildRouter();
    const resolved = router.resolve('/c/local/explorer/projectsnamespaces');

    expect(resolved.name).toBe('c-cluster-product-projectsnamespaces');
  });

  it('should still resolve other products through the generic route', async() => {
    const router = await buildRouter();
    const resolved = router.resolve('/c/local/manager/provisioning.cattle.io.cluster');

    expect(resolved.name).toBe('c-cluster-product-resource');
    expect(resolved.params).toMatchObject({ product: 'manager', resource: 'provisioning.cattle.io.cluster' });
  });

  it('should resolve the overview page', async() => {
    const router = await buildRouter();
    const resolved = router.resolve('/c/local/explorer/cert-manager-overview');

    expect(resolved.name).toBe('c-cluster-explorer-cert-manager-overview');
  });
});
