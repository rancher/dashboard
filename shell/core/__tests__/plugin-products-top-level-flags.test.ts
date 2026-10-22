import { Plugin } from '@shell/core/plugin';
import Resource from '@shell/plugins/dashboard-store/resource-class.js';

jest.mock('@shell/config/version', () => ({ getVersionData: () => ({ Version: 'v2.15.0' }) }));
jest.mock('@shell/config/uiplugins', () => ({ parseRancherVersion: (v: string) => v }));
jest.mock('@shell/core/plugin-helpers', () => ({ getApplicableExtensionEnhancements: () => [] }));

/**
 * Register products on a real `Plugin` the way an extension would, then apply them so the
 * DSL runs and `productNames` is populated.
 */
function buildPlugin({ withTopLevelProduct }: { withTopLevelProduct: boolean }) {
  const plugin = new Plugin('my-ext') as any;

  if (withTopLevelProduct) {
    plugin.addProduct({ name: 'myext', label: 'My Ext' }, [{
      name: 'main', label: 'Main', component: {}
    }]);
  }

  plugin.extendProduct('explorer', [{ type: 'pod', label: 'Pods' }]);

  const store = {
    getters:  { 'type-map/productByName': () => ({ extendable: true }) },
    dispatch: jest.fn(),
    commit:   jest.fn(),
  };

  plugin.productConfigs.forEach((productConfig: any) => productConfig.apply(plugin, store));

  return plugin;
}

function resourceFor(plugin: any, productId: string) {
  return new Resource({
    id:       'default/ext-compat-pod',
    type:     'pod',
    metadata: { namespace: 'default', name: 'ext-compat-pod' },
  }, {
    getters:     { schemaFor: () => ({ attributes: { namespaced: true } }) },
    dispatch:    jest.fn(),
    rootState:   { $extension: { getPlugins: () => ({ 'my-ext': plugin }) } },
    rootGetters: {
      productId, clusterId: 'local', 'i18n/t': jest.fn()
    },
  }) as any;
}

describe('top-level product flags are tracked per product', () => {
  describe('given a plugin that registers a top-level product and also extends explorer', () => {
    it('should only record the top-level product, not the extended one', () => {
      const plugin = buildPlugin({ withTopLevelProduct: true });

      expect(plugin.productNames).toStrictEqual(['myext', 'explorer']);
      expect([...plugin.topLevelProducts]).toStrictEqual(['myext']);
      expect(plugin.startRouteWithProductByProduct).toStrictEqual({ myext: true });
    });

    it('should route explorer resources through the core product routes', () => {
      // Regression: a plugin-wide flag made explorer look top-level here, producing the
      // route name `explorer-c-cluster-resource-namespace-id`, which is never registered.
      // `router-link` could not resolve it, so the Name column rendered empty.
      const pod = resourceFor(buildPlugin({ withTopLevelProduct: true }), 'explorer');

      expect(pod.isProdRegistrationV2TopLevelProductResoure).toStrictEqual(false);
      expect(pod.detailLocation.name).toStrictEqual('c-cluster-product-resource-namespace-id');
      expect(pod.listLocation.name).toStrictEqual('c-cluster-product-resource');
    });

    it('should still product-prefix routes for the plugin own top-level product', () => {
      const resource = resourceFor(buildPlugin({ withTopLevelProduct: true }), 'myext');

      expect(resource.isProdRegistrationV2TopLevelProductResoure).toStrictEqual(true);
      expect(resource.detailLocation.name).toStrictEqual('myext-c-cluster-resource-namespace-id');
    });
  });

  describe('given a plugin that only extends explorer', () => {
    it('should record no top-level product and use the core product routes', () => {
      const plugin = buildPlugin({ withTopLevelProduct: false });

      expect([...plugin.topLevelProducts]).toStrictEqual([]);
      expect(resourceFor(plugin, 'explorer').detailLocation.name).toStrictEqual('c-cluster-product-resource-namespace-id');
    });
  });

  describe('given the deprecated plugin-wide boolean', () => {
    it('should resolve from the per-product set, for extensions bundling an older shell', () => {
      expect(buildPlugin({ withTopLevelProduct: true }).topLevelProduct).toStrictEqual(true);
      expect(buildPlugin({ withTopLevelProduct: false }).topLevelProduct).toStrictEqual(false);
    });
  });
});

describe('generic resource routes when extending an existing product', () => {
  it('should not re-register routes that shadow the parent product own routes', () => {
    // `c/:cluster/explorer/:resource` outranks the core `c/:cluster/:product/<static>` routes,
    // so registering it here broke Explorer's members/namespaces/projectsnamespaces pages.
    const routeNames = buildPlugin({ withTopLevelProduct: true }).routes.map((r: any) => r.route.name);

    expect(routeNames).not.toContain('c-cluster-explorer-resource');
    expect(routeNames).not.toContain('c-cluster-explorer-resource-namespace-id');
  });

  it('should still register them for a brand new top-level product', () => {
    const plugin = new Plugin('my-ext') as any;

    plugin.addProduct({ name: 'myext', label: 'My Ext' }, [{ type: 'pod', label: 'Pods' }]);

    const routeNames = plugin.routes.map((r: any) => r.route.name);

    expect(routeNames).toContain('myext-c-cluster-resource');
    expect(routeNames).toContain('myext-c-cluster-resource-namespace-id');
  });
});
