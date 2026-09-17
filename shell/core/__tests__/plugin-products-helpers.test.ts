import { RouteMeta } from 'vue-router';
import {
  ProductChild, ProductChildGroup, ProductChildCustomPage, ProductChildResourcePage, ProductChildPage
} from '@shell/core/plugin-products-external';
import pluginProductsHelpers from '@shell/core/plugin-products-helpers';
import { hasNameProperty, isProductChildGroup } from '@shell/core/plugin-products-type-guards';
import { RouteRecordRawWithParams } from '@shell/core/plugin-types';
import { BLANK_CLUSTER } from '@shell/store/store-types';

/**
 * `gatherChildrenOrdering` hands back the `ProductChild` union. Narrow a result back down to a
 * group, with the same type guard the product code uses, before reaching for `sideMenu.children`.
 */
const getGroup = (child: ProductChild): ProductChildGroup => {
  if (!isProductChildGroup(child)) {
    throw new Error('Expected the product child to be a group');
  }

  return child;
};

/**
 * Only some members of the `ProductChild` union carry a `name`, so narrow with the same type guard
 * the product code uses before asserting on it.
 */
const getName = (child: ProductChild): string => {
  if (!hasNameProperty(child)) {
    throw new Error('Expected the product child to have a name');
  }

  return child.name;
};

/**
 * `sideMenu` and its `weight` are both optional on the union, so narrow the weight that
 * `gatherChildrenOrdering` assigned down to a number before comparing it.
 */
const getWeight = (child: ProductChild): number => {
  const weight = child.sideMenu?.weight;

  if (typeof weight !== 'number') {
    throw new Error('Expected the product child to have been assigned a weight');
  }

  return weight;
};

/**
 * The generated routes have an optional `meta`, so narrow it before an assertion reaches into it.
 */
const getMeta = (route: RouteRecordRawWithParams): RouteMeta => {
  if (!route.meta) {
    throw new Error('Expected the generated route to have meta');
  }

  return route.meta;
};

const gatherChildrenOrdering = pluginProductsHelpers.gatherChildrenOrdering.bind(pluginProductsHelpers);
const generateTopLevelExtensionSimpleBaseRoute = pluginProductsHelpers.generateTopLevelExtensionSimpleBaseRoute.bind(pluginProductsHelpers);
const generateVirtualTypeRoute = pluginProductsHelpers.generateVirtualTypeRoute.bind(pluginProductsHelpers);
const generateConfigureTypeRoute = pluginProductsHelpers.generateConfigureTypeRoute.bind(pluginProductsHelpers);
const generateResourceRoutes = pluginProductsHelpers.generateResourceRoutes.bind(pluginProductsHelpers);

describe('plugin-products-helpers', () => {
  // ============= gatherChildrenOrdering tests =============
  describe('gatherChildrenOrdering', () => {
    it('should sort children by weight descending', () => {
      const children: ProductChildCustomPage[] = [
        {
          name: 'a', label: 'A', component: {}, sideMenu: { weight: 10 },
        },
        {
          name: 'b', label: 'B', component: {}, sideMenu: { weight: 30 },
        },
        {
          name: 'c', label: 'C', component: {}, sideMenu: { weight: 20 },
        },
      ];

      const result = gatherChildrenOrdering(children);

      expect(result[0].label).toBe('B'); // 30
      expect(result[1].label).toBe('C'); // 20
      expect(result[2].label).toBe('A'); // 10
      // Verify original array is not mutated
      expect(children[0].name).toBe('a');
      expect(children[1].name).toBe('b');
      expect(children[2].name).toBe('c');
    });

    it('should assign weights to items missing them', () => {
      const children: ProductChild[] = [
        {
          name: 'a', label: 'A', component: {}, sideMenu: { weight: 50 },
        },
        {
          name: 'b', label: 'B', component: {}
        },
        {
          name: 'c', label: 'C', component: {}
        },
      ];

      const result = gatherChildrenOrdering(children);

      expect(getWeight(result[0])).toBe(50);
      expect(getWeight(result[1])).toBeLessThan(50); // 49
      expect(getWeight(result[2])).toBeLessThan(getWeight(result[1])); // 48
    });

    it('should use 999 as minWeight when no explicit weights are provided', () => {
      const children: ProductChildPage[] = [
        {
          name: 'a', label: 'A', component: {}
        },
        {
          name: 'b', label: 'B', component: {}
        },
        {
          name: 'c', label: 'C', component: {}
        },
      ];

      const result = gatherChildrenOrdering(children);

      // minWeight starts at 999, then each item gets minWeight - (index + 1)
      // so: 999 - 1 = 998, 999 - 2 = 997, 999 - 3 = 996
      expect(getWeight(result[0])).toBe(998);
      expect(getWeight(result[1])).toBe(997);
      expect(getWeight(result[2])).toBe(996);
    });

    it('should recursively apply ordering to nested children', () => {
      const children: ProductChildGroup[] = [
        {
          name:     'group',
          label:    'Group',
          sideMenu: {
            weight:   50,
            children: [
              {
                name: 'nested-a', label: 'Nested A', component: {}, sideMenu: { weight: 20 }
              },
              {
                name: 'nested-b', label: 'Nested B', component: {}, sideMenu: { weight: 10 }
              },
              {
                name: 'nested-c', label: 'Nested C', component: {}
              }, // no weight
            ],
          }
        },
      ];

      const result = gatherChildrenOrdering(children);

      const nested = getGroup(result[0]).sideMenu.children;

      expect(getName(nested[0])).toBe('nested-a'); // 20
      expect(getName(nested[1])).toBe('nested-b'); // 10
      expect(getName(nested[2])).toBe('nested-c'); // auto-assigned 9
    });

    it('should handle empty children array', () => {
      const children: any[] = [];
      const result = gatherChildrenOrdering(children);

      expect(result).toStrictEqual([]);
    });

    it('should not mutate order when weights are not provided for all items', () => {
      const children: ProductChildPage[] = [
        {
          name: 'first', label: 'First', component: {}
        },
        {
          name: 'second', label: 'Second', component: {}, sideMenu: { weight: 100 },
        },
        {
          name: 'third', label: 'Third', component: {}
        },
      ];

      const result = gatherChildrenOrdering(children);

      // second should be first due to highest weight
      expect(getName(result[0])).toBe('second');
      expect(getName(result[1])).toBe('first');
      expect(getName(result[2])).toBe('third');
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

      const route = generateVirtualTypeRoute('my-product', page.name);

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

      const route = generateVirtualTypeRoute('my-product', page.name, { extendProduct: true });

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

      const route = generateVirtualTypeRoute('my-product', page.name, { omitPath: true });

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
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

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

    it('should reuse the parent product core resource route when extendProduct is true', () => {
      // An extended product's resource pages reuse the core `c-cluster-product-resource` route rather
      // than a per-extension `c-cluster-my-product-resource`. A static product segment would outrank
      // the core `:product` route and shadow the parent's specific virtual-type routes.
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

      const route = generateConfigureTypeRoute('my-product', page, { extendProduct: true });

      expect(route.name).toBe('c-cluster-product-resource');
      expect(route.path).toBe('c/:cluster/:product/:resource');
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
      const route = generateConfigureTypeRoute('my-product', undefined);

      expect(route.name).toBe('my-product-c-cluster-resource');
      expect(route.params?.resource).toBeUndefined();
    });

    it('should omit path when omitPath option is true', () => {
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

      const route = generateConfigureTypeRoute('my-product', page, { omitPath: true });

      expect(route.path).toBeUndefined();
      expect(route.name).toBe('my-product-c-cluster-resource');
    });

    it('should include component when provided', () => {
      const MockComponent = { template: '<div>test</div>' };
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

      const route = generateConfigureTypeRoute('my-product', page, { component: MockComponent });

      expect(route.component).toBe(MockComponent);
    });
  });

  // ============= generateResourceRoutes tests =============
  describe('generateResourceRoutes', () => {
    it('should generate all resource routes for top-level extension', () => {
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

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
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

      const routes = generateResourceRoutes('my-product', page);

      expect(getMeta(routes[2]).asyncSetup).toBe(true); // detail route
      expect(getMeta(routes[3]).asyncSetup).toBe(true); // edit route
      expect(getMeta(routes[0]).asyncSetup).toBeUndefined(); // list route
      expect(getMeta(routes[1]).asyncSetup).toBeUndefined(); // create route
    });

    it('should generate cluster-level extension resource routes when extendProduct is true', () => {
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

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
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

      const routes = generateResourceRoutes('my-product', page);

      routes.forEach((route) => {
        expect(getMeta(route).cluster).toBe(BLANK_CLUSTER);
        expect(getMeta(route).product).toBe('my-product');
      });
    });

    it('should not include BLANK_CLUSTER in meta for cluster-level extensions', () => {
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

      const routes = generateResourceRoutes('my-product', page, { extendProduct: true });

      routes.forEach((route) => {
        expect(getMeta(route).cluster).toBeUndefined();
        expect(getMeta(route).product).toBe('my-product');
      });
    });

    it('should have component as async functions by default', () => {
      const page: ProductChildPage = { type: 'provisioning.cattle.io.cluster' };

      const routes = generateResourceRoutes('my-product', page);

      routes.forEach((route) => {
        expect(typeof route.component).toBe('function');
      });
    });
  });

  // ============= Integration-like tests =============
  describe('integration: complex product structure', () => {
    it('should handle a complete product config ordering and route generation', () => {
      const config: ProductChild[] = [
        {
          name: 'overview', label: 'Overview', component: {}, sideMenu: { weight: 10 },
        },
        {
          name: 'settings', label: 'Settings', sideMenu: { weight: 5 }, type: 'core.v1.configmap'
        },
        {
          name:     'resources',
          label:    'Resources',
          type:     'core.v1.pod',
          sideMenu: { weight: 15 },
        },
      ];

      const ordered = gatherChildrenOrdering(config);

      // Should be sorted by weight descending: 15, 10, 5
      expect(getWeight(ordered[0])).toBe(15);
      expect(getName(ordered[0])).toBe('resources');
      expect(getWeight(ordered[1])).toBe(10);
      expect(getName(ordered[1])).toBe('overview');
      expect(getWeight(ordered[2])).toBe(5);
      expect(getName(ordered[2])).toBe('settings');

      // Test route generation for each
      const overviewRoute = generateVirtualTypeRoute('my-product', getName(ordered[1]));

      expect(overviewRoute.name).toContain('overview');

      const resourceRoute = generateConfigureTypeRoute('my-product', ordered[0] as ProductChildResourcePage);

      expect(resourceRoute.path).toContain('resource');
    });

    it('should handle nested group ordering', () => {
      const config: ProductChildGroup[] = [
        {
          name:     'main',
          label:    'Main',
          sideMenu: {
            weight:   50,
            children: [
              {
                name: 'page1', label: 'Page 1', component: {}, sideMenu: { weight: 100 }
              },
              {
                name: 'page2', label: 'Page 2', component: {}
              },
              {
                name: 'page3', label: 'Page 3', component: {}, sideMenu: { weight: 50 }
              },
            ],
          }
        },
      ];
      const ordered = gatherChildrenOrdering(config);

      const nested = getGroup(ordered[0]).sideMenu.children;

      expect(getName(nested[0])).toBe('page1'); // 100
      expect(getName(nested[1])).toBe('page3'); // 50
      expect(getName(nested[2])).toBe('page2'); // auto 49
    });
  });
});
