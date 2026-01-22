import {
  gatherChildrenOrdering,
  generateTopLevelExtensionSimpleBaseRoute,
  generateVirtualTypeRoute,
  generateConfigureTypeRoute,
  generateResourceRoutes,
} from '@shell/core/plugin-products-helpers';
import { BLANK_CLUSTER } from '@shell/store/store-types';
import { ProductChildPage } from '@shell/core/types';

describe('plugin-products-helpers', () => {
  // ============= gatherChildrenOrdering tests =============
  describe('gatherChildrenOrdering', () => {
    it('should sort children by weight descending', () => {
      const children = [
        { name: 'a', weight: 10 },
        { name: 'b', weight: 30 },
        { name: 'c', weight: 20 },
      ];

      const result = gatherChildrenOrdering(children);

      expect(result[0].name).toBe('b'); // 30
      expect(result[1].name).toBe('c'); // 20
      expect(result[2].name).toBe('a'); // 10
    });

    it('should assign weights to items missing them', () => {
      const children = [
        { name: 'a', weight: 50 },
        { name: 'b' },
        { name: 'c' },
      ];

      const result = gatherChildrenOrdering(children);

      expect(result[0].weight).toBe(50);
      expect(result[1].weight).toBeLessThan(50); // 49
      expect(result[2].weight).toBeLessThan(result[1].weight); // 48
    });

    it('should use 999 as minWeight when no explicit weights are provided', () => {
      const children = [
        { name: 'a' },
        { name: 'b' },
        { name: 'c' },
      ];

      const result = gatherChildrenOrdering(children);

      // minWeight starts at 999, then each item gets minWeight - (index + 1)
      // so: 999 - 1 = 998, 999 - 2 = 997, 999 - 3 = 996
      expect(result[0].weight).toBe(998);
      expect(result[1].weight).toBe(997);
      expect(result[2].weight).toBe(996);
    });

    it('should recursively apply ordering to nested children', () => {
      const children = [
        {
          name:     'group',
          weight:   50,
          children: [
            { name: 'nested-a', weight: 20 },
            { name: 'nested-b', weight: 10 },
            { name: 'nested-c' }, // no weight
          ],
        },
      ];

      const result = gatherChildrenOrdering(children);

      expect(result[0].children[0].name).toBe('nested-a'); // 20
      expect(result[0].children[1].name).toBe('nested-b'); // 10
      expect(result[0].children[2].name).toBe('nested-c'); // auto-assigned 9
    });

    it('should handle empty children array', () => {
      const children: any[] = [];
      const result = gatherChildrenOrdering(children);

      expect(result).toStrictEqual([]);
    });

    it('should not mutate order when weights are not provided for all items', () => {
      const children = [
        { name: 'first' },
        { name: 'second', weight: 100 },
        { name: 'third' },
      ];

      const result = gatherChildrenOrdering(children);

      // second should be first due to highest weight
      expect(result[0].name).toBe('second');
      expect(result[1].name).toBe('first');
      expect(result[2].name).toBe('third');
    });
  });

  // ============= generateTopLevelExtensionSimpleBaseRoute tests =============
  describe('generateTopLevelExtensionSimpleBaseRoute', () => {
    it('should generate base route with path and params', () => {
      const route = generateTopLevelExtensionSimpleBaseRoute('my-product');

      expect(route.name).toBe('my-product');
      expect(route.path).toBe('my-product');
      expect(route.params).toStrictEqual({ product: 'my-product' });
      expect(route.meta).toStrictEqual({ product: 'my-product' });
    });

    it('should include component when provided', () => {
      const MockComponent = { template: '<div>test</div>' };
      const route = generateTopLevelExtensionSimpleBaseRoute('my-product', { component: MockComponent });

      expect(route.component).toBe(MockComponent);
    });

    it('should omit path when omitPath option is true', () => {
      const route = generateTopLevelExtensionSimpleBaseRoute('my-product', { omitPath: true });

      expect(route.path).toBeUndefined();
      expect(route.name).toBe('my-product');
      expect(route.params).toStrictEqual({ product: 'my-product' });
    });

    it('should include component and omit path when both options are set', () => {
      const MockComponent = { template: '<div>test</div>' };
      const route = generateTopLevelExtensionSimpleBaseRoute('my-product', {
        component: MockComponent,
        omitPath:  true,
      });

      expect(route.component).toBe(MockComponent);
      expect(route.path).toBeUndefined();
    });
  });

  // ============= generateVirtualTypeRoute tests =============
  describe('generateVirtualTypeRoute', () => {
    it('should generate top-level extension route when extendProduct is false/undefined', () => {
      const page: ProductChildPage = {
        name:      'overview',
        label:     'Overview',
        component: () => Promise.resolve({ default: {} }),
      };

      const route = generateVirtualTypeRoute('my-product', page);

      expect(route.name).toBe('my-product-c-cluster-overview');
      expect(route.path).toBe('my-product/c/:cluster/overview');
      expect(route.params).toStrictEqual({
        product: 'my-product',
        cluster: BLANK_CLUSTER,
      });
      expect(route.meta).toStrictEqual({
        product: 'my-product',
        cluster: BLANK_CLUSTER,
      });
    });

    it('should generate cluster-level extension route when extendProduct is true', () => {
      const page: ProductChildPage = {
        name:      'overview',
        label:     'Overview',
        component: () => Promise.resolve({ default: {} }),
      };

      const route = generateVirtualTypeRoute('my-product', page, { extendProduct: true });

      expect(route.name).toBe('c-cluster-my-product-overview');
      expect(route.path).toBe('c/:cluster/my-product/overview');
      expect(route.params).toStrictEqual({ product: 'my-product' });
      expect(route.meta).toStrictEqual({ product: 'my-product' });
    });

    it('should handle group routes without page child', () => {
      const route = generateVirtualTypeRoute('my-product', undefined);

      expect(route.name).toBe('my-product-c-cluster');
      expect(route.path).toBe('my-product/c/:cluster');
    });

    it('should omit path when omitPath option is true', () => {
      const page: ProductChildPage = {
        name:      'settings',
        label:     'Settings',
        component: () => Promise.resolve({ default: {} }),
      };

      const route = generateVirtualTypeRoute('my-product', page, { omitPath: true });

      expect(route.path).toBeUndefined();
      expect(route.name).toBe('my-product-c-cluster-settings');
    });

    it('should use provided component', () => {
      const MockComponent = { template: '<div>test</div>' };
      const route = generateVirtualTypeRoute('my-product', undefined, { component: MockComponent });

      expect(route.component).toBe(MockComponent);
    });
  });

  // ============= generateConfigureTypeRoute tests =============
  describe('generateConfigureTypeRoute', () => {
    it('should generate top-level extension resource route', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const route = generateConfigureTypeRoute('my-product', page);

      expect(route.name).toBe('my-product-c-cluster-resource');
      expect(route.path).toBe('my-product/c/:cluster/:resource');
      expect(route.params).toStrictEqual({
        product:  'my-product',
        cluster:  BLANK_CLUSTER,
        resource: 'provisioning.cattle.io.cluster',
      });
      expect(route.meta).toStrictEqual({
        product:  'my-product',
        cluster:  BLANK_CLUSTER,
        resource: 'provisioning.cattle.io.cluster',
      });
    });

    it('should generate cluster-level extension resource route when extendProduct is true', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const route = generateConfigureTypeRoute('my-product', page, { extendProduct: true });

      expect(route.name).toBe('c-cluster-my-product-resource');
      expect(route.path).toBe('c/:cluster/my-product/:resource');
      expect(route.params).toStrictEqual({
        product:  'my-product',
        resource: 'provisioning.cattle.io.cluster',
      });
      expect(route.meta).toStrictEqual({
        product:  'my-product',
        resource: 'provisioning.cattle.io.cluster',
      });
    });

    it('should handle pages without a type gracefully', () => {
      const page: Partial<ProductChildPage> = { name: 'clusters' };

      const route = generateConfigureTypeRoute('my-product', page as ProductChildPage);

      expect(route.name).toBe('my-product-c-cluster-resource');
      expect(route.params.resource).toBeUndefined();
    });

    it('should omit path when omitPath option is true', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const route = generateConfigureTypeRoute('my-product', page, { omitPath: true });

      expect(route.path).toBeUndefined();
      expect(route.name).toBe('my-product-c-cluster-resource');
    });

    it('should include component when provided', () => {
      const MockComponent = { template: '<div>test</div>' };
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const route = generateConfigureTypeRoute('my-product', page, { component: MockComponent });

      expect(route.component).toBe(MockComponent);
    });
  });

  // ============= generateResourceRoutes tests =============
  describe('generateResourceRoutes', () => {
    it('should generate all resource routes for top-level extension', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const routes = generateResourceRoutes('my-product', page);

      expect(routes).toHaveLength(4);
      expect(routes[0].name).toBe('my-product-c-cluster-resource');
      expect(routes[0].path).toBe('my-product/c/:cluster/:resource');

      expect(routes[1].name).toBe('my-product-c-cluster-resource-create');
      expect(routes[1].path).toBe('my-product/c/:cluster/:resource/create');

      expect(routes[2].name).toBe('my-product-c-cluster-resource-id');
      expect(routes[2].path).toBe('my-product/c/:cluster/:resource/:id');

      expect(routes[3].name).toBe('my-product-c-cluster-resource-namespace-id');
      expect(routes[3].path).toBe('my-product/c/:cluster/:resource/:namespace/:id');
    });

    it('should include meta data with asyncSetup for detail and edit routes', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const routes = generateResourceRoutes('my-product', page);

      expect(routes[2].meta.asyncSetup).toBe(true); // detail route
      expect(routes[3].meta.asyncSetup).toBe(true); // edit route
      expect(routes[0].meta.asyncSetup).toBeUndefined(); // list route
      expect(routes[1].meta.asyncSetup).toBeUndefined(); // create route
    });

    it('should generate cluster-level extension resource routes when extendProduct is true', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const routes = generateResourceRoutes('my-product', page, { extendProduct: true });

      expect(routes[0].name).toBe('c-cluster-my-product-resource');
      expect(routes[0].path).toBe('c/:cluster/my-product/:resource');

      expect(routes[1].name).toBe('c-cluster-my-product-resource-create');
      expect(routes[1].path).toBe('c/:cluster/my-product/:resource/create');

      expect(routes[2].name).toBe('c-cluster-my-product-resource-id');
      expect(routes[2].path).toBe('c/:cluster/my-product/:resource/:id');

      expect(routes[3].name).toBe('c-cluster-my-product-resource-namespace-id');
      expect(routes[3].path).toBe('c/:cluster/my-product/:resource/:namespace/:id');
    });

    it('should include BLANK_CLUSTER in meta for top-level extensions', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const routes = generateResourceRoutes('my-product', page);

      routes.forEach((route) => {
        expect((route.meta as any).cluster).toBe(BLANK_CLUSTER);
        expect(route.meta.product).toBe('my-product');
      });
    });

    it('should not include BLANK_CLUSTER in meta for cluster-level extensions', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const routes = generateResourceRoutes('my-product', page, { extendProduct: true });

      routes.forEach((route) => {
        expect((route.meta as any).cluster).toBeUndefined();
        expect(route.meta.product).toBe('my-product');
      });
    });

    it('should use provided component options', () => {
      const MockListComponent = { template: '<div>list</div>' };
      const MockCreateComponent = { template: '<div>create</div>' };
      const MockItemComponent = { template: '<div>item</div>' };
      const MockNamespacedComponent = { template: '<div>namespaced</div>' };

      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const routes = generateResourceRoutes('my-product', page, {
        resourceListComponent:           MockListComponent,
        resourceCreateComponent:         MockCreateComponent,
        resourceItemComponent:           MockItemComponent,
        resourceItemNamespacedComponent: MockNamespacedComponent,
      });

      expect(routes[0].component).toBe(MockListComponent);
      expect(routes[1].component).toBe(MockCreateComponent);
      expect(routes[2].component).toBe(MockItemComponent);
      expect(routes[3].component).toBe(MockNamespacedComponent);
    });

    it('should have component as async functions by default', () => {
      const page: ProductChildPage = {
        name:      'clusters',
        type:      'provisioning.cattle.io.cluster',
        component: () => Promise.resolve({ default: {} }),
      };

      const routes = generateResourceRoutes('my-product', page);

      routes.forEach((route) => {
        expect(typeof route.component).toBe('function');
      });
    });
  });

  // ============= Integration-like tests =============
  describe('integration: complex product structure', () => {
    it('should handle a complete product config ordering and route generation', () => {
      const config = [
        { name: 'overview', weight: 10 },
        { name: 'settings', weight: 5 },
        {
          name:   'resources',
          type:   'core.v1.pod',
          weight: 15,
        },
      ];

      const ordered = gatherChildrenOrdering(config);

      // Should be sorted by weight descending: 15, 10, 5
      expect(ordered[0].weight).toBe(15);
      expect(ordered[0].name).toBe('resources');
      expect(ordered[1].weight).toBe(10);
      expect(ordered[1].name).toBe('overview');
      expect(ordered[2].weight).toBe(5);
      expect(ordered[2].name).toBe('settings');

      // Test route generation for each
      const overviewRoute = generateVirtualTypeRoute('my-product', ordered[1] as ProductChildPage);

      expect(overviewRoute.name).toContain('overview');

      const resourceRoute = generateConfigureTypeRoute('my-product', ordered[0] as ProductChildPage);

      expect(resourceRoute.path).toContain('resource');
    });

    it('should handle nested group ordering', () => {
      const config = [
        {
          name:     'main',
          weight:   50,
          children: [
            { name: 'page1', weight: 100 },
            { name: 'page2' },
            { name: 'page3', weight: 50 },
          ],
        },
      ];

      const ordered = gatherChildrenOrdering(config);

      expect(ordered[0].children[0].name).toBe('page1'); // 100
      expect(ordered[0].children[1].name).toBe('page3'); // 50
      expect(ordered[0].children[2].name).toBe('page2'); // auto 49
    });
  });
});
