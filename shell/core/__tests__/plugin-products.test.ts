import { PluginProduct } from '@shell/core/plugin-products';
import {
  IPlugin, ProductMetadata, ProductSinglePage, ProductChildPage,
  ProductChildGroup, ProductChildResource, StandardProductName
} from '@shell/core/types';
import { Router } from 'vue-router';

// Mock the helper functions
jest.mock('@shell/core/plugin-products-helpers', () => ({
  gatherChildrenOrdering:                   jest.fn((config) => config),
  generateTopLevelExtensionSimpleBaseRoute: jest.fn((name, opts) => ({
    name:      `${ name }-simple`,
    path:      opts?.omitPath ? '' : `/${ name }`,
    component: opts?.component,
  })),
  generateVirtualTypeRoute: jest.fn((parentName, page, opts) => ({
    name:      page ? `${ parentName }-${ page.name }` : `${ parentName }-group`,
    path:      opts?.omitPath ? '' : `/${ parentName }/${ page?.name || 'group' }`,
    component: opts?.component,
  })),
  generateConfigureTypeRoute: jest.fn((parentName, page, opts) => ({
    name: `${ parentName }-${ page.name }`,
    path: opts?.omitPath ? '' : `/${ parentName }/${ page.name }`,
  })),
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

jest.mock('@shell/core/column-builder', () => ({
  processHeadersConfig: jest.fn((config) => ({
    defaults:   ['STATE', 'NAME', 'NAMESPACE', 'AGE'],
    pagination: ['STEVE_NAME_COL', 'STEVE_NAMESPACE_COL', 'STEVE_AGE_COL'],
  })),
}));

jest.mock('@shell/core/productDebugger', () => ({
  DSLRegistrationsPerProduct: jest.fn(),
  registeredRoutes:           jest.fn(),
}));

// Create mock factories
function createMockPlugin(): IPlugin {
  return {
    registerTopLevelProduct: jest.fn(),
    addRoute:                jest.fn(),
    DSL:                     jest.fn((store, productName) => ({
      basicType:           jest.fn(),
      labelGroup:          jest.fn(),
      setGroupDefaultType: jest.fn(),
      weightGroup:         jest.fn(),
      virtualType:         jest.fn(),
      configureType:       jest.fn(),
      weightType:          jest.fn(),
      product:             jest.fn(),
      headers:             jest.fn(),
    })),
  } as any;
}

function createMockRouter(): Router {
  return { addRoute: jest.fn() } as any;
}

function createMockStore(): any {
  return {};
}

describe('pluginProduct', () => {
  describe('new product scenarios', () => {
    it('should create a new product with config items', () => {
      const mockPlugin = createMockPlugin();
      const productMetadata: ProductMetadata = {
        name:  'test-product',
        label: 'Test Product',
        icon:  'icon-test',
      };
      const config: ProductChildPage[] = [
        {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewPage' },
        },
        {
          name:      'details',
          label:     'Details',
          component: { name: 'DetailsPage' },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      expect(pluginProduct.newProduct).toBe(true);
      expect(mockPlugin.registerTopLevelProduct).toHaveBeenCalledTimes(1);
      expect(mockPlugin.addRoute).toHaveBeenCalledTimes(2);
    });

    it('should create a single page product', () => {
      const mockPlugin = createMockPlugin();
      const productSinglePage: ProductSinglePage = {
        name:      'single-page-product',
        label:     'Single Page',
        component: { name: 'SinglePageComponent' },
      };

      const pluginProduct = new PluginProduct(mockPlugin, productSinglePage, []);

      expect(pluginProduct.newProduct).toBe(true);
      expect(mockPlugin.registerTopLevelProduct).toHaveBeenCalledTimes(1);
      expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
    });

    it('should handle product names with dashes by removing them', () => {
      const mockPlugin = createMockPlugin();
      const productMetadata: ProductMetadata = {
        name:  'test-product-name',
        label: 'Test',
      };

      new PluginProduct(mockPlugin, productMetadata, []);

      expect(mockPlugin.registerTopLevelProduct).toHaveBeenCalledTimes(1);
    });

    it('should create default empty page config when no config provided', () => {
      const mockPlugin = createMockPlugin();
      const productMetadata: ProductMetadata = {
        name:  'empty-product',
        label: 'Empty',
      };

      new PluginProduct(mockPlugin, productMetadata, []);

      expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
    });

    it('should throw error when product object lacks name property', () => {
      const mockPlugin = createMockPlugin();
      const invalidProduct = { label: 'No Name' } as any;

      expect(() => {
        new PluginProduct(mockPlugin, invalidProduct, []);
      }).toThrow('Invalid product');
    });

    it('should throw error when product type is invalid', () => {
      const mockPlugin = createMockPlugin();

      expect(() => {
        new PluginProduct(mockPlugin, 123 as any, []);
      }).toThrow('Invalid product');
    });
  });

  describe('extending standard product', () => {
    it('should extend an existing standard product with valid name', () => {
      const mockPlugin = createMockPlugin();
      const config: ProductChildPage[] = [
        {
          name:      'custom-section',
          label:     'Custom',
          component: { name: 'CustomComponent' },
        },
      ];

      const validStandardProduct = StandardProductName.EXPLORER;

      const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

      expect(pluginProduct.newProduct).toBe(false);
      expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
    });

    it('should throw error when extending invalid standard product', () => {
      const mockPlugin = createMockPlugin();
      const invalidStandardProduct = 'invalid-product';

      expect(() => {
        new PluginProduct(mockPlugin, invalidStandardProduct, []);
      }).toThrow('Invalid product name');
    });

    it('should not register new product when extending standard product', () => {
      const mockPlugin = createMockPlugin();
      const validStandardProduct = StandardProductName.EXPLORER;

      new PluginProduct(mockPlugin, validStandardProduct, []);

      expect(mockPlugin.registerTopLevelProduct).not.toHaveBeenCalled();
    });
  });

  describe('apply stage - product registration', () => {
    it('should register new product via DSL during apply', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'new-product',
        label: 'New Product',
      };
      const config: ProductChildPage[] = [
        {
          name:      'page1',
          label:     'Page 1',
          component: { name: 'Page1' },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.product).toHaveBeenCalledTimes(1);
      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({
          name:                'newproduct',
          inStore:             'management',
          version:             2,
          showClusterSwitcher: false,
          category:            'global',
        })
      );
    });

    it('should not register product when extending standard product during apply', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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

      const validStandardProduct = StandardProductName.EXPLORER;

      const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, []);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.product).not.toHaveBeenCalled();
    });

    it('should configure virtualType items during apply', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'product-with-pages',
        label: 'Product',
      };
      const config: ProductChildPage[] = [
        {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewComponent' },
          weight:    10,
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.virtualType).toHaveBeenCalledTimes(1);
      expect(mockDSL.virtualType).toHaveBeenCalledWith(
        expect.objectContaining({
          name:   'productwithpages-overview',
          label:  'Overview',
          weight: 10,
        })
      );
    });

    it('should configure configureType (resource) items during apply', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'resource-product',
        label: 'Resources',
      };
      const config: ProductChildResource[] = [
        {
          type:   'custom.resource',
          weight: 5,
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.configureType).toHaveBeenCalledWith(
        'custom.resource',
        expect.objectContaining({
          isCreatable: true,
          isEditable:  true,
          isRemovable: true,
          canYaml:     true,
        })
      );
      expect(mockDSL.weightType).toHaveBeenCalledWith('custom.resource', 5, true);
    });
  });

  describe('grouped items', () => {
    it('should handle product with grouped items', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'grouped-product',
        label: 'Grouped',
      };
      const groupedConfig: ProductChildGroup[] = [
        {
          name:     'settings',
          label:    'Settings',
          children: [
            {
              name:      'general',
              label:     'General',
              component: { name: 'GeneralSettings' },
            },
            {
              name:      'advanced',
              label:     'Advanced',
              component: { name: 'AdvancedSettings' },
            },
          ],
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, groupedConfig);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.basicType).toHaveBeenCalledTimes(2);
      expect(mockDSL.labelGroup).toHaveBeenCalledWith(
        expect.stringContaining('settings'),
        'Settings',
        undefined
      );
      expect(mockDSL.virtualType).toHaveBeenCalledTimes(2);
    });

    it('should set group default type when group has no component', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'group-no-component',
        label: 'Group No Component',
      };
      const config: ProductChildGroup[] = [
        {
          name:     'group',
          label:    'Group Without Component',
          children: [
            {
              name:      'child1',
              label:     'Child 1',
              component: { name: 'Child1Component' },
            },
          ],
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.setGroupDefaultType).toHaveBeenCalledWith(
        expect.stringContaining('group'),
        expect.stringContaining('child1')
      );
    });

    it('should not set group default type when group has component', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'group-with-component',
        label: 'Group With Component',
      };
      const config: ProductChildGroup[] = [
        {
          name:      'group',
          label:     'Group With Component',
          component: { name: 'GroupOverviewComponent' },
          children:  [
            {
              name:      'child1',
              label:     'Child 1',
              component: { name: 'Child1Component' },
            },
          ],
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.setGroupDefaultType).not.toHaveBeenCalled();
    });

    it('should apply group weight when specified', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'weighted-group',
        label: 'Weighted',
      };
      const config: ProductChildGroup[] = [
        {
          name:     'group',
          label:    'Group',
          weight:   50,
          children: [
            {
              name:      'child',
              label:     'Child',
              component: { name: 'ChildComponent' },
            },
          ],
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.weightGroup).toHaveBeenCalledWith(
        expect.stringContaining('group'),
        50,
        true
      );
    });
  });

  describe('default route determination', () => {
    it('should use first config item as default route for new product', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'default-route-product',
        label: 'Default Route',
      };
      const config: ProductChildPage[] = [
        {
          name:      'first',
          label:     'First',
          component: { name: 'FirstComponent' },
        },
        {
          name:      'second',
          label:     'Second',
          component: { name: 'SecondComponent' },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({ to: expect.objectContaining({ name: expect.stringContaining('first') }) })
      );
    });

    it('should use first group child as default route when first item is group', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'group-default-route',
        label: 'Group Default',
      };
      const config: ProductChildGroup[] = [
        {
          name:     'settings',
          label:    'Settings',
          children: [
            {
              name:      'general',
              label:     'General',
              component: { name: 'GeneralComponent' },
            },
          ],
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({ to: expect.objectContaining({ name: expect.stringContaining('general') }) })
      );
    });
  });

  describe('mixed config types', () => {
    it('should handle product with mixed virtualType and configureType items', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const mockRouter = createMockRouter();
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
        name:  'mixed-product',
        label: 'Mixed Content',
      };
      const mixedConfig: (ProductChildPage | ProductChildResource)[] = [
        {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewComponent' },
        },
        {
          type:  'resources.io',
          label: 'Resources',
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, mixedConfig);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.virtualType).toHaveBeenCalledTimes(1);
      expect(mockDSL.configureType).toHaveBeenCalledWith('resources.io', expect.any(Object));
    });
  });

  describe('error handling', () => {
    it('should throw error when config children is not an array', () => {
      const mockPlugin = createMockPlugin();
      const productMetadata: ProductMetadata = {
        name:  'bad-group',
        label: 'Bad Group',
      };
      const badConfig: any[] = [
        {
          name:     'group',
          label:    'Group',
          children: 'not-an-array', // Invalid
        },
      ];

      expect(() => {
        new PluginProduct(mockPlugin, productMetadata, badConfig);
      }).toThrow('forEach');
    });

    it('should throw when extending standard product and group parent has component', () => {
      const mockPlugin = createMockPlugin();
      const config: ProductChildGroup[] = [
        {
          name:      'parent-group',
          label:     'Parent Group',
          component: { name: 'GroupComponent' },
          children:  [
            {
              name:      'child',
              label:     'Child',
              component: { name: 'ChildComponent' },
            },
          ],
        },
      ];

      expect(() => {
        new PluginProduct(mockPlugin, StandardProductName.EXPLORER, config);
      }).toThrow('When extending an existing product, group parent items cannot have a component because of route matching conflicts.');
    });
  });

  describe('state verification', () => {
    it('should set newProduct flag for new products', () => {
      const mockPlugin = createMockPlugin();
      const productMetadata: ProductMetadata = {
        name:  'new-prod',
        label: 'New',
      };

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, []);

      expect(pluginProduct.newProduct).toBe(true);
    });

    it('should not set newProduct flag for standard product extensions', () => {
      const mockPlugin = createMockPlugin();
      const validStandardProduct = StandardProductName.EXPLORER;

      const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, []);

      expect(pluginProduct.newProduct).toBe(false);
    });
  });

  describe('real-world scenarios from pkg/add-new-prod', () => {
    describe('scenario 1: simple product with single page component (plain layout)', () => {
      it('should create single page product with plain layout', () => {
        const mockPlugin = createMockPlugin();
        const productSinglePage: ProductSinglePage = {
          name:      'alex-simple-one-page',
          weight:    -100,
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
          name:   'alex-simple-top-level',
          weight: -100,
          label:  'Simple (with sidebar)',
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
        const mockRouter = createMockRouter();
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
          name:   'alex-simple-children',
          weight: -100,
          label:  'Simple with Children',
        };
        const config: ProductChildPage[] = [
          {
            name:      'page1',
            label:     'My label for page 1',
            component: { name: 'TestComponent' },
          },
          {
            name:      'page2',
            label:     'My label for page 2',
            component: { name: 'TestComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(2);
        expect(mockDSL.product).toHaveBeenCalledTimes(1);
      });
    });

    describe('scenario 4: product with simple children (virtualTypes) + type (configureType)', () => {
      it('should handle mix of virtualType pages and resource types', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockRouter = createMockRouter();
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
          name:   'alex-simple-children',
          weight: -100,
          label:  'Simple with Children',
        };
        const config: (ProductChildPage | ProductChildResource)[] = [
          {
            name:      'page1',
            label:     'My label for page 1',
            component: { name: 'TestComponent' },
          },
          {
            name:      'page2',
            label:     'My label for page 2',
            component: { name: 'TestComponent' },
          },
          { type: 'upgrade.cattle.io.plan' },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(2);
        expect(mockDSL.configureType).toHaveBeenCalledWith('upgrade.cattle.io.plan', expect.any(Object));
      });
    });

    describe('scenario 5: product with type first, then children with nested groups', () => {
      it('should handle resource type first, then virtualType pages with nested children', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockRouter = createMockRouter();
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
          name:   'alex-simple-children',
          weight: -100,
          label:  'Simple with Children',
        };
        const config: (ProductChildResource | ProductChildGroup | ProductChildPage)[] = [
          { type: 'fleet.cattle.io.clustergroup' },
          {
            name:      'page1',
            label:     'My label for page 1',
            component: { name: 'TestComponent' },
            children:  [
              {
                name:      'hello0',
                label:     'Testing 12',
                labelKey:  'aks.label',
                component: { name: 'TestComponent' },
              } as any,
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
          { type: 'upgrade.cattle.io.plan' },
          {
            name:      'page2',
            label:     'My label for page 2',
            component: { name: 'TestComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

        expect(mockDSL.configureType).toHaveBeenCalledWith('fleet.cattle.io.clustergroup', expect.any(Object));
        expect(mockDSL.virtualType).toHaveBeenCalledTimes(6);
        expect(mockDSL.labelGroup).toHaveBeenCalledTimes(1);
        expect(mockDSL.product).toHaveBeenCalledTimes(1);
      });
    });

    describe('scenario 6: extend standard product without configuring children', () => {
      it('should extend existing standard product with empty config', () => {
        const mockPlugin = createMockPlugin();
        const validStandardProduct = StandardProductName.EXPLORER;

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, []);

        expect(pluginProduct.newProduct).toBe(false);
        expect(mockPlugin.registerTopLevelProduct).not.toHaveBeenCalled();
        expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
      });
    });

    describe('scenario 7: extend standard product with simple virtualType children', () => {
      it('should extend standard product adding simple virtualType page', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockRouter = createMockRouter();
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

        const validStandardProduct = StandardProductName.EXPLORER;
        const config: ProductChildPage[] = [
          {
            name:      'mysettings',
            label:     'Custom',
            weight:    97,
            component: { name: 'TestComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(1);
        expect(mockDSL.product).not.toHaveBeenCalled();
      });
    });

    describe('scenario 8: extend standard product with mixed types and nested groups', () => {
      it('should extend standard product adding mixed virtualTypes and resource types with nested groups', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const mockRouter = createMockRouter();
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

        const validStandardProduct = StandardProductName.EXPLORER;
        const config: (ProductChildGroup | ProductChildResource | ProductChildPage)[] = [
          {
            name:     'page1',
            label:    'My label for page 1',
            weight:   -10,
            children: [
              {
                name:      'hello0',
                label:     'Testing 12',
                labelKey:  'aks.label',
                component: { name: 'TestComponent' },
              } as any,
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
          { type: 'upgrade.cattle.io.plan' },
          {
            name:      'page2',
            label:     'My label for page 2',
            component: { name: 'TestComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(5);
        expect(mockDSL.configureType).toHaveBeenCalledWith('upgrade.cattle.io.plan', expect.any(Object));
        expect(mockDSL.labelGroup).toHaveBeenCalledTimes(1);
        expect(mockDSL.product).not.toHaveBeenCalled();
      });
    });
  });

  describe('headers configuration', () => {
    let mockPlugin: IPlugin;
    let mockStore: any;
    let mockRouter: Router;
    let mockDSL: any;

    beforeEach(() => {
      jest.clearAllMocks();

      mockPlugin = createMockPlugin();
      mockStore = createMockStore();
      mockRouter = createMockRouter();
      mockDSL = {
        product:             jest.fn(),
        basicType:           jest.fn(),
        labelGroup:          jest.fn(),
        setGroupDefaultType: jest.fn(),
        weightGroup:         jest.fn(),
        virtualType:         jest.fn(),
        configureType:       jest.fn(),
        weightType:          jest.fn(),
        headers:             jest.fn(),
      };

      (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);
    });

    it('should process headers configuration when provided on resource page', () => {
      const { processHeadersConfig } = require('@shell/core/column-builder');

      const productMetadata: ProductMetadata = {
        name:  'test-product',
        label: 'Test',
      };
      const config: ProductChildResource[] = [
        {
          type:    'apps.deployment',
          headers: {
            preset:     'namespaced',
            pagination: 'auto',
          },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(processHeadersConfig).toHaveBeenCalledWith({
        preset:     'namespaced',
        pagination: 'auto',
      });
      expect(mockDSL.headers).toHaveBeenCalledWith(
        'apps.deployment',
        ['STATE', 'NAME', 'NAMESPACE', 'AGE'],
        ['STEVE_NAME_COL', 'STEVE_NAMESPACE_COL', 'STEVE_AGE_COL']
      );
    });

    it('should process headers with explicit columns configuration', () => {
      const { processHeadersConfig } = require('@shell/core/column-builder');

      const productMetadata: ProductMetadata = {
        name:  'test-product',
        label: 'Test',
      };
      const config: ProductChildResource[] = [
        {
          type:    'core.service',
          headers: {
            columns:    ['state', 'name', 'namespace', 'specType', 'age'],
            pagination: 'auto',
          },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(processHeadersConfig).toHaveBeenCalledWith({
        columns:    ['state', 'name', 'namespace', 'specType', 'age'],
        pagination: 'auto',
      });
      expect(mockDSL.headers).toHaveBeenCalledWith(
        'core.service',
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('should not call headers DSL method when no headers config provided', () => {
      const productMetadata: ProductMetadata = {
        name:  'test-product',
        label: 'Test',
      };
      const config: ProductChildResource[] = [
        { type: 'apps.deployment' },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.headers).not.toHaveBeenCalledWith();
    });

    it('should handle errors in headers processing gracefully', () => {
      const { processHeadersConfig } = require('@shell/core/column-builder');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      processHeadersConfig.mockImplementationOnce(() => {
        throw new Error('Invalid headers configuration');
      });

      const productMetadata: ProductMetadata = {
        name:  'test-product',
        label: 'Test',
      };
      const config: ProductChildResource[] = [
        {
          type:    'apps.deployment',
          headers: { preset: 'invalid-preset' } as any,
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing headers for type "apps.deployment":',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should process headers for multiple resources', () => {
      const { processHeadersConfig } = require('@shell/core/column-builder');

      const productMetadata: ProductMetadata = {
        name:  'multi-resource-product',
        label: 'Multi Resource',
      };
      const config: ProductChildResource[] = [
        {
          type:    'apps.deployment',
          headers: {
            preset:     'workload',
            pagination: 'auto',
          },
        },
        {
          type:    'core.service',
          headers: {
            preset:     'namespaced',
            add:        ['specType', 'targetPort'],
            pagination: 'auto',
          },
        },
        {
          type:    'core.pod',
          headers: {
            columns:    ['state', 'name', 'node', 'age'],
            pagination: 'auto',
          },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(processHeadersConfig).toHaveBeenCalledTimes(3);
      expect(mockDSL.headers).toHaveBeenCalledTimes(3);
      expect(mockDSL.headers).toHaveBeenCalledWith(
        'apps.deployment',
        expect.any(Array),
        expect.any(Array)
      );
      expect(mockDSL.headers).toHaveBeenCalledWith(
        'core.service',
        expect.any(Array),
        expect.any(Array)
      );
      expect(mockDSL.headers).toHaveBeenCalledWith(
        'core.pod',
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('should process headers when extending standard product', () => {
      const { processHeadersConfig } = require('@shell/core/column-builder');

      const config: ProductChildResource[] = [
        {
          type:    'apps.deployment',
          headers: {
            preset:     'workload',
            pagination: 'auto',
          },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, StandardProductName.EXPLORER, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(processHeadersConfig).toHaveBeenCalledWith(expect.any(Object));
      expect(mockDSL.headers).toHaveBeenCalledWith(
        'apps.deployment',
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('should handle mixed resource types with and without headers', () => {
      const { processHeadersConfig } = require('@shell/core/column-builder');

      const productMetadata: ProductMetadata = {
        name:  'mixed-product',
        label: 'Mixed',
      };
      const config: (ProductChildResource | ProductChildPage)[] = [
        {
          type:    'apps.deployment',
          headers: {
            preset:     'workload',
            pagination: 'auto',
          },
        },
        {
          type: 'core.service',
          // No headers config
        },
        {
          name:      'custom-page',
          label:     'Custom',
          component: { name: 'CustomComponent' },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(processHeadersConfig).toHaveBeenCalledTimes(1);
      expect(mockDSL.headers).toHaveBeenCalledTimes(1);
      expect(mockDSL.headers).toHaveBeenCalledWith(
        'apps.deployment',
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('should preserve other resource configuration when headers are provided', () => {
      const productMetadata: ProductMetadata = {
        name:  'test-product',
        label: 'Test',
      };
      const config: ProductChildResource[] = [
        {
          type:    'apps.deployment',
          weight:  100,
          headers: {
            preset:     'workload',
            pagination: 'auto',
          },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore, mockRouter, {});

      expect(mockDSL.weightType).toHaveBeenCalledWith('apps.deployment', 100, true);
      expect(mockDSL.headers).toHaveBeenCalledWith(
        'apps.deployment',
        expect.any(Array),
        expect.any(Array)
      );
    });
  });
});
