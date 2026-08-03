import { PluginProduct } from '@shell/core/plugin-products';
import { IExtension } from '@shell/core/types';
import {
  ProductChild,
  ProductChildCustomPage, ProductChildGroup, ProductChildPage, ProductChildResourcePage, ProductMetadata, ProductMetadataSinglePage, StandardProductNames
} from '@shell/core/plugin-products-external';

// Mock the helper functions
jest.mock('@shell/core/plugin-products-helpers', () => ({
  gatherChildrenOrdering:                   jest.fn((config) => config),
  generateTopLevelExtensionSimpleBaseRoute: jest.fn((name, opts) => ({
    name:      `${ name }-simple`,
    path:      opts?.omitPath ? '' : `/${ name }`,
    component: opts?.component,
  })),
  generateVirtualTypeRoute: jest.fn((parentName, childName, opts) => ({
    name:      childName ? `${ parentName }-${ childName }` : `${ parentName }-group`,
    path:      opts?.omitPath ? '' : `/${ parentName }/${ childName || 'group' }`,
    component: opts?.component,
  })),
  generateConfigureTypeRoute: jest.fn((parentName, page, opts) => {
    const routeName = opts?.extendProduct ? `c-cluster-${ parentName }-resource` : `${ parentName }-c-cluster-resource`;
    const routePath = opts?.extendProduct ? `c/:cluster/${ parentName }/:resource` : `${ parentName }/c/:cluster/:resource`;
    const cluster = opts?.extendProduct ? undefined : '__BLANK_CLUSTER__';

    return {
      name:   routeName,
      path:   opts?.omitPath ? '' : routePath,
      params: cluster ? {
        product:  parentName.replace(/-/g, ''),
        cluster,
        resource: page?.type,
      } : {
        product:  parentName,
        resource: page?.type,
      },
    };
  }),
  generateResourceRoutes: jest.fn((parentName, child) => [
    {
      name: `${ parentName }-${ child.type }-list`,
      path: `/${ parentName }/${ child.type }`,
    },
    {
      name: `${ parentName }-${ child.type }-detail`,
      path: `/${ parentName }/${ child.type }/:id`,
    },
  ]),
}));

jest.mock('@shell/core/productDebugger', () => ({
  DSLRegistrationsPerProduct: jest.fn(),
  registeredRoutes:           jest.fn(),
}));

// Create mock factories
function createMockPlugin(): IExtension {
  return {
    _registerTopLevelProduct:   jest.fn(),
    addRoute:                   jest.fn(),
    enableServerSidePagination: jest.fn(),
    DSL:                        jest.fn(),
  } as any as IExtension;
}

function createMockStore(extendableProducts: string[] = Object.values(StandardProductNames), managementSchemas: string[] = []): any {
  return {
    getters: {
      'type-map/productByName': (productName: string) => (extendableProducts.includes(productName) ? { name: productName, extendable: true } : undefined),
      'management/schemaFor':   (type: string) => (managementSchemas.includes(type) ? { id: type } : undefined),
    }
  };
}

describe('pluginProduct', () => {
  describe('real-world scenarios from pkg/add-new-prod', () => {
    describe('scenario 1: simple product with single page component (plain layout)', () => {
      it('should create single page product with plain layout', () => {
        const mockPlugin = createMockPlugin();
        const productSinglePage: ProductMetadataSinglePage = {
          name:      'alex-simple-one-page',
          sideBar:   { weight: -100, icon: { name: 'aaa' } },
          label:     'Simple One Page (no sidebar)',
          component: { name: 'TestComponent' },
        };

        const pluginProduct = new PluginProduct(mockPlugin, productSinglePage, []);

        expect(pluginProduct.newProduct).toBe(true);
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });
    });

    describe('scenario 2: simple product without children', () => {
      it('should create product with sidebar but no config children', () => {
        const mockPlugin = createMockPlugin();
        const productMetadata: ProductMetadata = {
          name:    'alex-simple-top-level',
          sideBar: { weight: -100, icon: { name: 'aaa' } },
          label:   'Simple (with sidebar)',
        };

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, []);

        expect(pluginProduct.newProduct).toBe(true);
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });
    });

    describe('scenario 3: simple product with simple children (virtualTypes)', () => {
      it('should create product with multiple simple virtualType children', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:    'alex-simple-children',
          sideBar: { weight: -100, icon: { name: 'aaa' } },
          label:   'Simple with Children',
        };
        const config: ProductChildPage[] = [
          {
            name:      'page1',
            label:     'My label for page 1',
            component: { name: 'TestComponent' },
            sideMenu:  { weight: 1 },
          },
          {
            name:      'page2',
            label:     'My label for page 2',
            component: { name: 'TestComponent' },
            sideMenu:  { weight: 2 },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(2);
        expect(mockDSL.product).toHaveBeenCalledTimes(1);
      });
    });

    describe('scenario 4: product with simple children (virtualTypes) + type (configureType)', () => {
      it('should handle mix of virtualType pages and resource types', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:    'alex-simple-children',
          sideBar: { weight: -100, icon: { name: 'aaa' } },
          label:   'Simple with Children',
        };
        const config: ProductChildPage[] = [
          {
            name:      'page1',
            label:     'My label for page 1',
            component: { name: 'TestComponent' },
            sideMenu:  { weight: 1 },
          },
          {
            name:      'page2',
            label:     'My label for page 2',
            component: { name: 'TestComponent' },
            sideMenu:  { weight: 2 },
          },
          { type: 'upgrade.cattle.io.plan', sideMenu: { weight: 3 } },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(2);
        expect(mockDSL.configureType).toHaveBeenCalledWith('upgrade.cattle.io.plan', expect.any(Object));
      });
    });

    describe('scenario 5: product with type first, then children with nested groups', () => {
      it('should handle resource type first, then virtualType pages with nested children', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:    'alex-simple-children',
          sideBar: { weight: -100, icon: { name: 'aaa' } },
          label:   'Simple with Children',
        };
        const config: (ProductChildGroup | ProductChildPage)[] = [
          { type: 'fleet.cattle.io.clustergroup', sideMenu: { weight: 1 } },
          {
            name:      'page1',
            label:     'My label for page 1',
            component: { name: 'TestComponent' },
            sideMenu:  {
              weight:   2,
              children: [
                {
                  name:      'hello0',
                  label:     'Testing 12',
                  labelKey:  'aks.label',
                  component: { name: 'TestComponent' },
                },
                {
                  name:      'hello1',
                  label:     'Testing 1',
                  labelKey:  'aks.label',
                  component: { name: 'TestComponent' },
                },
                {
                  name:      'hello3',
                  labelKey:  'aks.label',
                  component: { name: 'TestComponent' },
                },
                {
                  name:      'hello2',
                  label:     'Testing 2',
                  component: { name: 'TestComponent' },
                },
              ],
            },
          },
          { type: 'upgrade.cattle.io.plan', sideMenu: { weight: 3 } },
          {
            name:      'page2',
            label:     'My label for page 2',
            component: { name: 'TestComponent' },
            sideMenu:  { weight: 4 },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        expect(mockDSL.configureType).toHaveBeenCalledWith('fleet.cattle.io.clustergroup', expect.any(Object));
        expect(mockDSL.virtualType).toHaveBeenCalledTimes(6);
        expect(mockDSL.labelGroup).toHaveBeenCalledTimes(1);
        expect(mockDSL.product).toHaveBeenCalledTimes(1);
      });
    });

    describe('scenario 6: extend standard product without configuring children', () => {
      it('should extend existing standard product with empty config', () => {
        const mockPlugin = createMockPlugin();
        const validStandardProduct = StandardProductNames.EXPLORER;

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, []);

        expect(pluginProduct.newProduct).toBe(false);
        expect(mockPlugin._registerTopLevelProduct).not.toHaveBeenCalled();
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });
    });

    describe('scenario 7: extend standard product with simple virtualType children', () => {
      it('should extend standard product adding simple virtualType page', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const validStandardProduct = StandardProductNames.EXPLORER;
        const config: ProductChildPage[] = [
          {
            name:      'mysettings',
            label:     'Custom',
            component: { name: 'TestComponent' },
            sideMenu:  { weight: 97 },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore);

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(1);
        expect(mockDSL.product).not.toHaveBeenCalled();
      });
    });

    describe('scenario 8: extend standard product with mixed types and nested groups', () => {
      it('should extend standard product adding mixed virtualTypes and resource types with nested groups', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const validStandardProduct = StandardProductNames.EXPLORER;
        const config: (ProductChildGroup | ProductChildPage)[] = [
          {
            name:     'page1',
            label:    'My label for page 1',
            sideMenu: {
              weight:   -10,
              children: [
                {
                  name:      'hello0',
                  label:     'Testing 12',
                  labelKey:  'aks.label',
                  component: { name: 'TestComponent' },
                },
                {
                  name:      'hello1',
                  label:     'Testing 1',
                  component: { name: 'TestComponent' },
                },
                {
                  name:      'hello3',
                  labelKey:  'generic.unified',
                  component: { name: 'TestComponent' },
                },
                {
                  name:      'hello2',
                  label:     'Testing 2',
                  component: { name: 'TestComponent' },
                },
              ],
            },
          },
          { type: 'upgrade.cattle.io.plan', sideMenu: { weight: 1 } },
          {
            name:      'page2',
            label:     'My label for page 2',
            component: { name: 'TestComponent' },
            sideMenu:  { weight: 2 },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore);

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(5);
        expect(mockDSL.configureType).toHaveBeenCalledWith('upgrade.cattle.io.plan', expect.any(Object));
        expect(mockDSL.labelGroup).toHaveBeenCalledTimes(1);
        expect(mockDSL.product).not.toHaveBeenCalled();
      });
    });
  });

  describe('documentation examples', () => {
    describe('quick start: string convenience method', () => {
      it('should create a new product from just a string name', () => {
        const mockPlugin = createMockPlugin();
        const pluginProduct = PluginProduct.fromName(mockPlugin, 'my-first-product');

        expect(pluginProduct.newProduct).toBe(true);
        expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });
    });

    describe('single page product', () => {
      it('should create a product with a single page component and no config', () => {
        const mockPlugin = createMockPlugin();
        const product: ProductMetadataSinglePage = {
          name:      'my-dashboard',
          label:     'My Dashboard',
          component: { name: 'DashboardPage' },
          sideBar:   { icon: { name: 'globe' } },
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, []);

        expect(pluginProduct.newProduct).toBe(true);
        expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });
    });

    describe('product with custom pages', () => {
      it('should register routes for each custom page', () => {
        const mockPlugin = createMockPlugin();

        const overviewPage: ProductChildCustomPage = {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewPage' },
          sideMenu:  { weight: 2 },
        };

        const settingsPage: ProductChildCustomPage = {
          name:      'settings',
          label:     'Settings',
          component: { name: 'SettingsPage' },
          sideMenu:  { weight: 1 },
        };

        const product: ProductMetadata = {
          name:    'my-app',
          label:   'My App',
          sideBar: { icon: { name: 'gear' } }
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [overviewPage, settingsPage]);

        expect(pluginProduct.newProduct).toBe(true);
        expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(2);
      });
    });

    describe('product with resource pages', () => {
      it('should register resource CRUD routes for resource page items', () => {
        const mockPlugin = createMockPlugin();

        const clusterPage: ProductChildResourcePage = {
          type:     'provisioning.cattle.io.cluster',
          label:    'Clusters',
          sideMenu: { weight: 2 },
        };

        const nodePage: ProductChildResourcePage = {
          type:     'management.cattle.io.node',
          sideMenu: { weight: 1 },
        };

        const product: ProductMetadata = {
          name:  'my-resources',
          label: 'My Resources',
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [clusterPage, nodePage]);

        expect(pluginProduct.newProduct).toBe(true);
        // Resource routes are only added once (shared CRUD routes) - mock generates list + detail = 2
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(2);
      });
    });

    describe('product with groups', () => {
      it('should register routes for a product with groups and standalone pages', () => {
        const mockPlugin = createMockPlugin();

        const alertsPage: ProductChildCustomPage = {
          name:      'alerts',
          label:     'Alerts',
          component: { name: 'AlertsPage' },
        };

        const metricsPage: ProductChildCustomPage = {
          name:      'metrics',
          label:     'Metrics',
          component: { name: 'MetricsPage' },
        };

        const monitoringGroup: ProductChildGroup = {
          name:     'monitoring',
          label:    'Monitoring',
          sideMenu: {
            weight:   2,
            children: [alertsPage, metricsPage],
          },
        };

        const overviewPage: ProductChildCustomPage = {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewPage' },
          sideMenu:  { weight: 3 },
        };

        const product: ProductMetadata = {
          name:  'my-platform',
          label: 'My Platform',
        };

        const config: ProductChild[] = [overviewPage, monitoringGroup];
        const pluginProduct = new PluginProduct(mockPlugin, product, config);

        expect(pluginProduct.newProduct).toBe(true);
        expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
        // 1 standalone page + 1 group parent route + 2 group children routes = 4
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(4);
      });
    });

    describe('extending an existing product', () => {
      it('should extend explorer with a custom page', () => {
        const mockPlugin = createMockPlugin();

        const customPage: ProductChildCustomPage = {
          name:      'my-custom-view',
          label:     'My Custom View',
          component: { name: 'MyCustomView' },
        };

        const pluginProduct = new PluginProduct(mockPlugin, StandardProductNames.EXPLORER, [customPage]);

        expect(pluginProduct.newProduct).toBe(false);
        expect(mockPlugin._registerTopLevelProduct).not.toHaveBeenCalled();
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });
    });

    describe('mixed pages: custom + resource', () => {
      it('should register routes for both custom pages and resource pages together', () => {
        const mockPlugin = createMockPlugin();

        const product: ProductMetadata = {
          name:  'my-platform',
          label: 'My Platform',
        };

        const config: ProductChild[] = [
          {
            name:      'dashboard',
            label:     'Dashboard',
            component: { name: 'Dashboard' },
            sideMenu:  { weight: 3 },
          },
          { type: 'provisioning.cattle.io.cluster', sideMenu: { weight: 2 } },
          {
            name:      'settings',
            label:     'Settings',
            component: { name: 'Settings' },
            sideMenu:  { weight: 1 },
          },
        ];
        const pluginProduct = new PluginProduct(mockPlugin, product, config);

        expect(pluginProduct.newProduct).toBe(true);
        // 2 custom page routes + resource CRUD routes (list + detail = 2 from mock) = 4
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(4);
        // Verify addRoute was called for both custom pages and resource routes
        const routeCalls = (mockPlugin.addRoute as jest.Mock).mock.calls;
        const hasCustomRoutes = routeCalls.some((call) => call[0]?.name?.includes('dashboard'));
        const hasResourceRoutes = routeCalls.some((call) => call[0]?.name?.includes('provisioning.cattle.io.cluster'));

        expect(hasCustomRoutes).toBe(true);
        expect(hasResourceRoutes).toBe(true);
      });
    });

    describe('group with its own page', () => {
      it('should register a route for the group page itself and its children', () => {
        const mockPlugin = createMockPlugin();

        const alertsPage: ProductChildCustomPage = {
          name:      'alerts',
          label:     'Alerts',
          component: { name: 'AlertsPage' },
        };

        const metricsPage: ProductChildCustomPage = {
          name:      'metrics',
          label:     'Metrics',
          component: { name: 'MetricsPage' },
        };

        const monitoringGroup: ProductChildGroup = {
          name:      'monitoring',
          label:     'Monitoring',
          component: { name: 'MonitoringOverview' },
          sideMenu:  { children: [alertsPage, metricsPage] },
        };

        const product: ProductMetadata = {
          name:  'my-platform',
          label: 'My Platform',
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [monitoringGroup]);

        expect(pluginProduct.newProduct).toBe(true);
        // 1 group parent route (with component) + 2 children routes = 3
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(3);
      });

      it('should generate a route with the group name for proper side-menu highlighting', () => {
        const mockPlugin = createMockPlugin();

        const childPage: ProductChildCustomPage = {
          name:      'child',
          label:     'Child',
          component: { name: 'ChildComponent' },
        };

        const monitoringGroup: ProductChildGroup = {
          name:      'monitoring',
          label:     'Monitoring',
          component: { name: 'MonitoringOverview' },
          sideMenu:  { children: [childPage] },
        };

        const product: ProductMetadata = {
          name:  'my-platform',
          label: 'My Platform',
        };

        new PluginProduct(mockPlugin, product, [monitoringGroup]);

        // The group's own route should include the group name in the route name
        // This ensures the side-menu can highlight the correct item
        const routeCalls = (mockPlugin.addRoute as jest.Mock).mock.calls;
        const groupRoute = routeCalls.find((call) => call[0]?.name?.includes('monitoring'));

        expect(groupRoute).toBeDefined();
        expect(groupRoute[0].name).toStrictEqual(expect.stringContaining('monitoring'));
      });
    });

    describe('extending Cluster Explorer', () => {
      it('should extend explorer with a standalone page', () => {
        const mockPlugin = createMockPlugin();

        const customPage: ProductChildCustomPage = {
          name:      'cost-analysis',
          label:     'Cost Analysis',
          component: { name: 'CostAnalysis' },
        };

        const pluginProduct = new PluginProduct(mockPlugin, StandardProductNames.EXPLORER, [customPage]);

        expect(pluginProduct.newProduct).toBe(false);
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });

      it('should extend explorer with a group containing multiple pages', () => {
        const mockPlugin = createMockPlugin();

        const costPage: ProductChildCustomPage = {
          name:      'cost-analysis',
          label:     'Cost Analysis',
          component: { name: 'CostAnalysis' },
        };

        const usagePage: ProductChildCustomPage = {
          name:      'usage-report',
          label:     'Usage Report',
          component: { name: 'UsageReport' },
        };

        const insightsGroup: ProductChildGroup = {
          name:     'insights',
          label:    'Insights',
          sideMenu: { children: [costPage, usagePage] },
        };

        const pluginProduct = new PluginProduct(mockPlugin, StandardProductNames.EXPLORER, [insightsGroup]);

        expect(pluginProduct.newProduct).toBe(false);
        // 1 group parent route + 2 child routes = 3
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(3);
      });
    });

    describe('translation keys instead of labels', () => {
      it('should accept labelKey instead of label for product and pages', () => {
        const mockPlugin = createMockPlugin();

        const product: ProductMetadata = {
          name:     'my-app',
          labelKey: 'product.myApp.label',
          sideBar:  { icon: { name: 'gear' } }
        };

        const overviewPage: ProductChildCustomPage = {
          name:      'overview',
          labelKey:  'product.myApp.overview',
          component: { name: 'OverviewPage' },
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [overviewPage]);

        expect(pluginProduct.newProduct).toBe(true);
        expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });

      it('should register labelKey on virtualType during apply', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const virtualTypeCalls: any[] = [];
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((...args: any[]) => virtualTypeCalls.push(args)),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const product: ProductMetadata = {
          name:     'my-app',
          labelKey: 'product.myApp.label',
        };

        const overviewPage: ProductChildCustomPage = {
          name:      'overview',
          labelKey:  'product.myApp.overview',
          component: { name: 'OverviewPage' },
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [overviewPage]);

        pluginProduct.apply(mockPlugin, mockStore);

        expect(virtualTypeCalls).toHaveLength(1);
        expect(virtualTypeCalls[0][0]).toStrictEqual(expect.objectContaining({ labelKey: 'product.myApp.overview' }));
      });
    });

    describe('duplicate page name detection', () => {
      it('should throw when two custom pages have the same name in a new product', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const page1: ProductChildCustomPage = {
          name:      'overview',
          label:     'Overview',
          component: { name: 'Page1' },
        };

        const page2: ProductChildCustomPage = {
          name:      'overview',
          label:     'Overview Duplicate',
          component: { name: 'Page2' },
        };

        const product: ProductMetadata = {
          name:  'my-app',
          label: 'My App',
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [page1, page2]);

        expect(() => {
          pluginProduct.apply(mockPlugin, mockStore);
        }).toThrow('Duplicate page name "overview"');
      });

      it('should not throw when pages with the same name are in different groups (different resolved names)', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        // Same page name 'overview' but in different groups produces different resolved names
        const standalonePage: ProductChildCustomPage = {
          name:      'cost-analysis',
          label:     'Cost Analysis',
          component: { name: 'CostAnalysis1' },
        };

        const groupChildPage: ProductChildCustomPage = {
          name:      'cost-analysis',
          label:     'Cost Analysis',
          component: { name: 'CostAnalysis2' },
        };

        const group: ProductChildGroup = {
          name:     'insights',
          label:    'Insights',
          sideMenu: { children: [groupChildPage] }

        };

        const product: ProductMetadata = {
          name:  'my-app',
          label: 'My App',
        };

        const config: ProductChild[] = [standalonePage, group];
        const pluginProduct = new PluginProduct(mockPlugin, product, config);

        // Different groups produce different resolved names (myapp-cost-analysis vs myapp-insights-cost-analysis)
        expect(() => {
          pluginProduct.apply(mockPlugin, mockStore);
        }).not.toThrow();
      });

      it('should throw when two resource pages have the same type', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const resource1: ProductChildResourcePage = { type: 'provisioning.cattle.io.cluster' };

        const resource2: ProductChildResourcePage = { type: 'provisioning.cattle.io.cluster' };

        const product: ProductMetadata = {
          name:  'my-app',
          label: 'My App',
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [resource1, resource2]);

        expect(() => {
          pluginProduct.apply(mockPlugin, mockStore);
        }).toThrow('Duplicate resource type "provisioning.cattle.io.cluster"');
      });

      it('should not throw when pages have different names', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const page1: ProductChildCustomPage = {
          name:      'overview',
          label:     'Overview',
          component: { name: 'Page1' },
        };

        const page2: ProductChildCustomPage = {
          name:      'settings',
          label:     'Settings',
          component: { name: 'Page2' },
        };

        const product: ProductMetadata = {
          name:  'my-app',
          label: 'My App',
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [page1, page2]);

        expect(() => {
          pluginProduct.apply(mockPlugin, mockStore);
        }).not.toThrow();
      });
    });

    describe('group with component route naming', () => {
      it('should include the group name in the virtualType route for side-menu highlighting', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const virtualTypeCalls: any[] = [];
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((...args: any[]) => virtualTypeCalls.push(args)),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const childPage: ProductChildCustomPage = {
          name:      'alerts',
          label:     'Alerts',
          component: { name: 'AlertsPage' },
        };

        const monitoringGroup: ProductChildGroup = {
          name:      'monitoring',
          label:     'Monitoring',
          component: { name: 'MonitoringOverview' },
          sideMenu:  { children: [childPage] },
        };

        const product: ProductMetadata = {
          name:  'my-app',
          label: 'My App',
        };

        const pluginProduct = new PluginProduct(mockPlugin, product, [monitoringGroup]);

        pluginProduct.apply(mockPlugin, mockStore);

        // Find the virtualType call for the group (has exact + overview flags)
        const groupVirtualType = virtualTypeCalls.find((call) => call[0].exact === true && call[0].overview === true);

        expect(groupVirtualType).toBeDefined();
        // The route name should contain the group name 'monitoring', not a generic 'group'
        expect(groupVirtualType[0].route.name).toStrictEqual(expect.stringContaining('monitoring'));
        // It should NOT be a generic route without the group name
        expect(groupVirtualType[0].route.name).not.toBe('myapp-c-cluster');
      });
    });
  });
});
