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
    // Extending `explorer` registers `c/:cluster/explorer/:resource`, and vue-router ranks a
    // static segment above the generic `:product` one - so every explorer URL now matches the
    // extension's route record. Same page component either way, but the params must still parse.
    const router = await buildRouter();
    const resolved = router.resolve(path);

    expect(resolved.matched).not.toHaveLength(0);
    expect(resolved.params).toMatchObject(expected);
  });

  it('should still resolve the explorer product for shadowed routes', async() => {
    // The extension's route has no `:product` path param, so `params.product` is undefined and
    // `getProductFromRoute` has to fall back to the route name / meta. If that stops working,
    // every explorer page loses its product context.
    const router = await buildRouter();
    const resolved = router.resolve('/c/local/explorer/pod');

    expect(resolved.params.product).toBeUndefined();
    expect(getProductFromRoute(resolved)).toBe('explorer');
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
