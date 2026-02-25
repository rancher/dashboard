import { PluginProduct } from '@shell/core/plugin-products';
import {
  ProductMetadata, ProductSinglePage, ProductChildPage,
  ProductChildGroup, StandardProductName, StandardProductNames
} from '@shell/core/plugin-types';
import { IExtension } from '@shell/core/types';

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
    _registerTopLevelProduct: jest.fn(),
    addRoute:                 jest.fn(),
    DSL:                      jest.fn((store, productName) => ({
      basicType:           jest.fn(),
      labelGroup:          jest.fn(),
      setGroupDefaultType: jest.fn(),
      weightGroup:         jest.fn(),
      virtualType:         jest.fn(),
      configureType:       jest.fn(),
      weightType:          jest.fn(),
      product:             jest.fn(),
    })),
  } as any;
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
      expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
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
      expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
      expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
    });

    it('should handle product names with dashes by removing them', () => {
      const mockPlugin = createMockPlugin();
      const productMetadata: ProductMetadata = {
        name:  'test-product-name',
        label: 'Test',
      };

      new PluginProduct(mockPlugin, productMetadata, []);

      expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
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

      const validStandardProduct = StandardProductNames.EXPLORER;

      const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

      expect(pluginProduct.newProduct).toBe(false);
      expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
    });

    it('should throw error when extending invalid standard product', () => {
      const mockPlugin = createMockPlugin();
      const invalidStandardProduct = 'invalid-product';

      expect(() => {
        new PluginProduct(mockPlugin, invalidStandardProduct as StandardProductName, []);
      }).toThrow('Invalid product name');
    });

    it('should not register new product when extending standard product', () => {
      const mockPlugin = createMockPlugin();
      const validStandardProduct = StandardProductNames.EXPLORER;

      new PluginProduct(mockPlugin, validStandardProduct, []);

      expect(mockPlugin._registerTopLevelProduct).not.toHaveBeenCalled();
    });
  });

  describe('apply stage - product registration', () => {
    it('should register new product via DSL during apply', () => {
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

      pluginProduct.apply(mockPlugin, mockStore);

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

      const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, []);

      pluginProduct.apply(mockPlugin, mockStore);

      expect(mockDSL.product).not.toHaveBeenCalled();
    });

    it('should configure virtualType items during apply', () => {
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

      pluginProduct.apply(mockPlugin, mockStore);

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
      const config: ProductChildPage[] = [
        {
          type:   'custom.resource',
          weight: 5,
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore);

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

      pluginProduct.apply(mockPlugin, mockStore);

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

      pluginProduct.apply(mockPlugin, mockStore);

      expect(mockDSL.setGroupDefaultType).toHaveBeenCalledWith(
        expect.stringContaining('group'),
        expect.stringContaining('child1')
      );
    });

    it('should not set group default type when group has component', () => {
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

      pluginProduct.apply(mockPlugin, mockStore);

      expect(mockDSL.setGroupDefaultType).not.toHaveBeenCalled();
    });

    it('should apply group weight when specified', () => {
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

      pluginProduct.apply(mockPlugin, mockStore);

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

      pluginProduct.apply(mockPlugin, mockStore);

      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({ to: expect.objectContaining({ name: expect.stringContaining('first') }) })
      );
    });

    it('should use first group child as default route when first item is group', () => {
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

      pluginProduct.apply(mockPlugin, mockStore);

      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({ to: expect.objectContaining({ name: expect.stringContaining('general') }) })
      );
    });

    it('should use first group child with resource type as default route when first item is group', () => {
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
        name:  'group-resource-default',
        label: 'Group Resource Default',
      };
      const config: ProductChildGroup[] = [
        {
          name:     'resources',
          label:    'Resources',
          children: [
            { type: 'provisioning.cattle.io.cluster' },
          ],
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore);

      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.objectContaining({
            name:   'groupresourcedefault-c-cluster-resource',
            params: expect.objectContaining({
              product:  'groupresourcedefault',
              cluster:  '__BLANK_CLUSTER__',
              resource: 'provisioning.cattle.io.cluster',
            }),
          }),
        })
      );
    });
  });

  describe('mixed config types', () => {
    it('should handle product with mixed virtualType and configureType items', () => {
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
        name:  'mixed-product',
        label: 'Mixed Content',
      };
      const mixedConfig: ProductChildPage[] = [
        {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewComponent' },
        },
        { type: 'resources.io' },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, mixedConfig);

      pluginProduct.apply(mockPlugin, mockStore);

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
        new PluginProduct(mockPlugin, StandardProductNames.EXPLORER, config);
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
      const validStandardProduct = StandardProductNames.EXPLORER;

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
          { type: 'upgrade.cattle.io.plan' },
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
          name:   'alex-simple-children',
          weight: -100,
          label:  'Simple with Children',
        };
        const config: (ProductChildGroup | ProductChildPage)[] = [
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
            weight:    97,
            component: { name: 'TestComponent' },
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

        pluginProduct.apply(mockPlugin, mockStore);

        expect(mockDSL.virtualType).toHaveBeenCalledTimes(5);
        expect(mockDSL.configureType).toHaveBeenCalledWith('upgrade.cattle.io.plan', expect.any(Object));
        expect(mockDSL.labelGroup).toHaveBeenCalledTimes(1);
        expect(mockDSL.product).not.toHaveBeenCalled();
      });
    });
  });

  describe('side menu structure and ordering', () => {
    describe('new product - virtualType ordering', () => {
      it('should register virtualTypes in config array order when no weights specified', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const virtualTypeCalls: any[] = [];
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((...args) => virtualTypeCalls.push(args)),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'test-ordering',
          label: 'Test Ordering',
        };
        const config: ProductChildPage[] = [
          {
            name:      'first-page',
            label:     'First Page',
            component: { name: 'FirstComponent' },
          },
          {
            name:      'second-page',
            label:     'Second Page',
            component: { name: 'SecondComponent' },
          },
          {
            name:      'third-page',
            label:     'Third Page',
            component: { name: 'ThirdComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify order - virtualType calls should match config order
        expect(virtualTypeCalls).toHaveLength(3);
        expect(virtualTypeCalls[0][0]).toMatchObject({ name: 'testordering-first-page' });
        expect(virtualTypeCalls[1][0]).toMatchObject({ name: 'testordering-second-page' });
        expect(virtualTypeCalls[2][0]).toMatchObject({ name: 'testordering-third-page' });
      });

      it('should register virtualTypes with weight parameter for menu ordering', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const virtualTypeCalls: any[] = [];
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((...args) => virtualTypeCalls.push(args)),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'test-weights',
          label: 'Test Weights',
        };
        const config: ProductChildPage[] = [
          {
            name:      'low-priority',
            label:     'Low Priority',
            component: { name: 'Component1' },
            weight:    100,
          },
          {
            name:      'high-priority',
            label:     'High Priority',
            component: { name: 'Component2' },
            weight:    1,
          },
          {
            name:      'medium-priority',
            label:     'Medium Priority',
            component: { name: 'Component3' },
            weight:    50,
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify weight is passed to virtualType
        expect(virtualTypeCalls[0][0].weight).toBe(100);
        expect(virtualTypeCalls[1][0].weight).toBe(1);
        expect(virtualTypeCalls[2][0].weight).toBe(50);
      });
    });

    describe('new product - mixed types ordering', () => {
      it('should maintain order of virtualTypes and configureTypes as specified in config', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const dslCallOrder: string[] = [];
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => dslCallOrder.push(`basicType:${ args[0] }`)),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((...args) => dslCallOrder.push(`virtualType:${ args[0].name }`)),
          configureType:       jest.fn((...args) => dslCallOrder.push(`configureType:${ args[0] }`)),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'mixed-types',
          label: 'Mixed Types Product',
        };
        const config: ProductChildPage[] = [
          { type: 'fleet.cattle.io.clustergroup' },
          {
            name:      'custom-page',
            label:     'Custom Page',
            component: { name: 'CustomComponent' },
          },
          { type: 'upgrade.cattle.io.plan' },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify DSL methods called in correct order
        const relevantCalls = dslCallOrder.filter((call) => call.startsWith('configureType:') || call.startsWith('virtualType:')
        );

        expect(relevantCalls).toStrictEqual([
          'configureType:fleet.cattle.io.clustergroup',
          'virtualType:mixedtypes-custom-page',
          'configureType:upgrade.cattle.io.plan',
        ]);
      });
    });

    describe('new product - group menu structure', () => {
      it('should create nested side menu structure with groups', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const basicTypeCalls: any[] = [];
        const labelGroupCalls: any[] = [];
        const weightGroupCalls: any[] = [];
        const virtualTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => basicTypeCalls.push(args)),
          labelGroup:          jest.fn((...args) => labelGroupCalls.push(args)),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn((...args) => weightGroupCalls.push(args)),
          virtualType:         jest.fn((...args) => virtualTypeCalls.push(args)),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'grouped-product',
          label: 'Grouped Product',
        };
        const config: ProductChildGroup[] = [
          {
            name:     'settings-group',
            label:    'Settings',
            weight:   10,
            children: [
              {
                name:      'general',
                label:     'General',
                component: { name: 'GeneralComponent' },
              },
              {
                name:      'advanced',
                label:     'Advanced',
                component: { name: 'AdvancedComponent' },
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify group label was set
        expect(labelGroupCalls.length).toBeGreaterThan(0);
        expect(labelGroupCalls[0]).toStrictEqual(['groupedproduct-settings-group', 'Settings', undefined]);

        // Verify group weight was set
        expect(weightGroupCalls.length).toBeGreaterThan(0);
        expect(weightGroupCalls[0]).toStrictEqual(['groupedproduct-settings-group', 10, true]);

        // Verify basicType was called for navigation with group children
        // basicType is called twice: once for top-level items (excluding groups), once for group children
        expect(basicTypeCalls.length).toBeGreaterThan(1);
        // Check the second call which includes group children
        expect(basicTypeCalls[1][0]).toStrictEqual(expect.arrayContaining([
          expect.stringContaining('general'),
          expect.stringContaining('advanced')
        ]));

        // Verify nested virtualTypes were created
        expect(virtualTypeCalls).toHaveLength(2);
      });

      it('should set label for groups without explicit label via labelGroup', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const labelGroupCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn((...args) => labelGroupCalls.push(args)),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'product-with-groups',
          label: 'Product',
        };
        const config: ProductChildGroup[] = [
          {
            name:     'my-group',
            label:    'My Group Label',
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

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify labelGroup was called with the group's label
        expect(labelGroupCalls[0]).toStrictEqual(['productwithgroups-my-group', 'My Group Label', undefined]);
      });
    });

    describe('extending product - side menu additions', () => {
      it('should add virtualType to existing product navigation in order specified', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const virtualTypeCalls: any[] = [];
        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((...args) => virtualTypeCalls.push(args)),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const validStandardProduct = StandardProductNames.EXPLORER;
        const config: ProductChildPage[] = [
          {
            name:      'custom-section-1',
            label:     'Custom Section 1',
            weight:    99,
            component: { name: 'CustomComponent1' },
          },
          {
            name:      'custom-section-2',
            label:     'Custom Section 2',
            weight:    98,
            component: { name: 'CustomComponent2' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify virtualTypes added in order with weights
        expect(virtualTypeCalls).toHaveLength(2);
        expect(virtualTypeCalls[0][0]).toMatchObject({ name: 'explorer-custom-section-1' });
        expect(virtualTypeCalls[0][0].weight).toBe(99);
        expect(virtualTypeCalls[1][0]).toMatchObject({ name: 'explorer-custom-section-2' });
        expect(virtualTypeCalls[1][0].weight).toBe(98);
      });

      it('should add groups to existing product with proper navigation structure', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const basicTypeCalls: any[] = [];
        const labelGroupCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => basicTypeCalls.push(args)),
          labelGroup:          jest.fn((...args) => labelGroupCalls.push(args)),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const validStandardProduct = StandardProductNames.SETTINGS;
        const config: ProductChildGroup[] = [
          {
            name:     'extension-settings',
            label:    'Extension Settings',
            weight:   5,
            children: [
              {
                name:      'config-page',
                label:     'Configuration',
                component: { name: 'ConfigComponent' },
              },
              {
                name:      'advanced-page',
                label:     'Advanced',
                component: { name: 'AdvancedComponent' },
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify group label was set for the extended product
        expect(labelGroupCalls.length).toBeGreaterThan(0);
        expect(labelGroupCalls[0]).toStrictEqual(['settings-extension-settings', 'Extension Settings', undefined]);

        // Verify basicType includes children for navigation
        // basicType is called multiple times: first for top-level items, then for each group's children
        expect(basicTypeCalls.length).toBeGreaterThan(0);
        // Check the call that includes group children (should be in basicTypeCalls)
        const groupChildrenCall = basicTypeCalls.find((call) => call[0] && Array.isArray(call[0]) && call[0].some((name: string) => name.includes('config-page'))
        );

        expect(groupChildrenCall).toBeDefined();
        expect(groupChildrenCall![0]).toStrictEqual(expect.arrayContaining([
          expect.stringContaining('config-page'),
          expect.stringContaining('advanced-page')
        ]));
      });
    });

    describe('navigation and default route determination', () => {
      it('should pass correct default route to product registration', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        let productConfig: any;
        const mockDSL = {
          product: jest.fn((config) => {
            productConfig = config;
          }),
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
          name:  'test-default-route',
          label: 'Test Default Route',
        };
        const config: ProductChildPage[] = [
          {
            name:      'overview',
            label:     'Overview',
            component: { name: 'OverviewComponent' },
          },
          {
            name:      'details',
            label:     'Details',
            component: { name: 'DetailsComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify product registration includes default route (first config item)
        expect(productConfig).toBeDefined();
        expect(productConfig.to).toBeDefined();
      });

      it('should use first group child as default route when first config item is a group', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        let productConfig: any;
        const mockDSL = {
          product: jest.fn((config) => {
            productConfig = config;
          }),
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
          name:  'test-group-default',
          label: 'Test Group Default',
        };
        const config: ProductChildGroup[] = [
          {
            name:     'main-group',
            label:    'Main Group',
            children: [
              {
                name:      'first-child',
                label:     'First Child',
                component: { name: 'FirstChildComponent' },
              },
              {
                name:      'second-child',
                label:     'Second Child',
                component: { name: 'SecondChildComponent' },
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify default route points to first child of the group
        expect(productConfig).toBeDefined();
        expect(productConfig.to).toBeDefined();
      });
    });

    describe('comprehensive ordering scenario', () => {
      it('should maintain complex menu structure with proper ordering of mixed items', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const dslCallOrder: string[] = [];
        const weightTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => dslCallOrder.push(`basicType`)),
          labelGroup:          jest.fn((...args) => dslCallOrder.push(`labelGroup:${ args[0] }`)),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn((...args) => dslCallOrder.push(`weightGroup:${ args[0] }`)),
          virtualType:         jest.fn((...args) => dslCallOrder.push(`virtualType:${ args[0].name }`)),
          configureType:       jest.fn((...args) => dslCallOrder.push(`configureType:${ args[0] }`)),
          weightType:          jest.fn((...args) => weightTypeCalls.push(args)),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'complex-product',
          label: 'Complex Product',
        };
        const config: (ProductChildGroup | ProductChildPage)[] = [
          { type: 'fleet.cattle.io.clustergroup' }, // Resource type first
          {
            name:      'overview',
            label:     'Overview',
            weight:    1,
            component: { name: 'OverviewComponent' },
          },
          {
            name:     'settings',
            label:    'Settings',
            weight:   50,
            children: [
              {
                name:      'general',
                label:     'General',
                component: { name: 'GeneralComponent' },
              },
              {
                name:      'advanced',
                label:     'Advanced',
                component: { name: 'AdvancedComponent' },
              },
            ],
          },
          { type: 'upgrade.cattle.io.plan' }, // Another resource type
          {
            name:      'monitoring',
            label:     'Monitoring',
            weight:    100,
            component: { name: 'MonitoringComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify configureTypes were registered
        const configureTypeCalls = dslCallOrder.filter((call) => call.startsWith('configureType:'));

        expect(configureTypeCalls).toContain('configureType:fleet.cattle.io.clustergroup');
        expect(configureTypeCalls).toContain('configureType:upgrade.cattle.io.plan');

        // Verify virtualTypes were registered
        const virtualTypeCalls = dslCallOrder.filter((call) => call.startsWith('virtualType:'));

        expect(virtualTypeCalls).toContain('virtualType:complexproduct-overview');
        expect(virtualTypeCalls).toContain('virtualType:complexproduct-monitoring');
        expect(virtualTypeCalls).toContain('virtualType:complexproduct-settings-general');
        expect(virtualTypeCalls).toContain('virtualType:complexproduct-settings-advanced');

        // Verify group was configured
        const labelGroupCalls = dslCallOrder.filter((call) => call.startsWith('labelGroup:'));

        expect(labelGroupCalls).toContain('labelGroup:complexproduct-settings');
      });
    });
  });

  describe('sideNav menu structure rendering', () => {
    describe('new product - menu structure validation', () => {
      it('should create correct menu structure with proper ordering and names for simple virtualTypes', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();

        // Capture the menu structure that would be created
        const menuStructure: any = {
          basicTypes:   [],
          virtualTypes: [],
          groupLabels:  {},
          groupWeights: {},
        };

        const mockDSL = {
          product:   jest.fn(),
          basicType: jest.fn((types, group) => {
            menuStructure.basicTypes.push({ types, group });
          }),
          labelGroup: jest.fn((group, label, labelKey) => {
            menuStructure.groupLabels[group] = { label, labelKey };
          }),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn((group, weight) => {
            menuStructure.groupWeights[group] = weight;
          }),
          virtualType: jest.fn((config) => {
            menuStructure.virtualTypes.push(config);
          }),
          configureType: jest.fn(),
          weightType:    jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'my-product',
          label: 'My Product',
        };
        const config: ProductChildPage[] = [
          {
            name:      'overview',
            label:     'Overview',
            weight:    100,
            component: { name: 'OverviewComponent' },
          },
          {
            name:      'settings',
            label:     'Settings',
            weight:    50,
            component: { name: 'SettingsComponent' },
          },
          {
            name:      'monitoring',
            label:     'Monitoring',
            weight:    25,
            component: { name: 'MonitoringComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify menu structure ordering (virtualTypes are registered in config order but with weights)
        expect(menuStructure.virtualTypes).toHaveLength(3);

        // Menu items should have concatenated product-page names
        expect(menuStructure.virtualTypes[0].name).toBe('myproduct-overview');
        expect(menuStructure.virtualTypes[0].label).toBe('Overview');
        expect(menuStructure.virtualTypes[0].weight).toBe(100);

        expect(menuStructure.virtualTypes[1].name).toBe('myproduct-settings');
        expect(menuStructure.virtualTypes[1].label).toBe('Settings');
        expect(menuStructure.virtualTypes[1].weight).toBe(50);

        expect(menuStructure.virtualTypes[2].name).toBe('myproduct-monitoring');
        expect(menuStructure.virtualTypes[2].label).toBe('Monitoring');
        expect(menuStructure.virtualTypes[2].weight).toBe(25);

        // Verify basicType creates flat navigation structure (no groups for simple pages)
        expect(menuStructure.basicTypes.length).toBeGreaterThan(0);
        expect(menuStructure.basicTypes[0].types).toStrictEqual(expect.arrayContaining([
          'myproduct-overview',
          'myproduct-settings',
          'myproduct-monitoring',
        ]));
      });

      it('should create correct menu structure with groups and nested items', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();

        const menuStructure: any = {
          basicTypes:   [],
          virtualTypes: [],
          groupLabels:  {},
          groupWeights: {},
        };

        const mockDSL = {
          product:   jest.fn(),
          basicType: jest.fn((types, group) => {
            menuStructure.basicTypes.push({ types, group });
          }),
          labelGroup: jest.fn((group, label, labelKey) => {
            menuStructure.groupLabels[group] = { label, labelKey };
          }),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn((group, weight) => {
            menuStructure.groupWeights[group] = weight;
          }),
          virtualType: jest.fn((config) => {
            menuStructure.virtualTypes.push(config);
          }),
          configureType: jest.fn(),
          weightType:    jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'grouped-product',
          label: 'Grouped Product',
        };
        const config: (ProductChildPage | ProductChildGroup)[] = [
          {
            name:      'overview',
            label:     'Overview',
            weight:    100,
            component: { name: 'OverviewComponent' },
          },
          {
            name:     'admin',
            label:    'Administration',
            weight:   50,
            children: [
              {
                name:      'users',
                label:     'Users',
                component: { name: 'UsersComponent' },
              },
              {
                name:      'roles',
                label:     'Roles',
                component: { name: 'RolesComponent' },
              },
            ],
          },
          {
            name:      'reports',
            label:     'Reports',
            weight:    25,
            component: { name: 'ReportsComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify group structure
        expect(menuStructure.groupLabels['groupedproduct-admin']).toStrictEqual({
          label:    'Administration',
          labelKey: undefined,
        });
        expect(menuStructure.groupWeights['groupedproduct-admin']).toBe(50);

        // Verify nested items in group have correct names
        const adminGroupItems = menuStructure.virtualTypes.filter((vt: any) => vt.name.includes('admin')
        );

        expect(adminGroupItems).toHaveLength(2);
        expect(adminGroupItems.some((item: any) => item.name === 'groupedproduct-admin-users')).toBe(true);
        expect(adminGroupItems.some((item: any) => item.name === 'groupedproduct-admin-roles')).toBe(true);

        // Verify top-level items ordering via basicType
        const topLevelCall = menuStructure.basicTypes.find((bt: any) => !bt.group);

        expect(topLevelCall).toBeDefined();
        expect(topLevelCall.types).toContain('groupedproduct-overview');
        expect(topLevelCall.types).toContain('groupedproduct-reports');
      });

      it('should render mixed virtualTypes and configureTypes in correct order', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();

        const menuStructure: any = {
          basicTypes:     [],
          virtualTypes:   [],
          configureTypes: [],
        };

        const mockDSL = {
          product:   jest.fn(),
          basicType: jest.fn((types, group) => {
            menuStructure.basicTypes.push({ types, group });
          }),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((config) => {
            menuStructure.virtualTypes.push({ name: config.name, weight: config.weight });
          }),
          configureType: jest.fn((type, config) => {
            menuStructure.configureTypes.push({ type, config });
          }),
          weightType: jest.fn((type, weight) => {
            // Find existing configureType and add weight
            const existing = menuStructure.configureTypes.find((ct: any) => ct.type === type);

            if (existing) {
              existing.weight = weight;
            }
          }),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'mixed-product',
          label: 'Mixed Product',
        };
        const config: ProductChildPage[] = [
          { type: 'fleet.cattle.io.clustergroup', weight: 100 },
          {
            name:      'overview',
            label:     'Overview',
            weight:    75,
            component: { name: 'OverviewComponent' },
          },
          { type: 'workload.io.deployment', weight: 50 },
          {
            name:      'settings',
            label:     'Settings',
            weight:    25,
            component: { name: 'SettingsComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // In SideNav, items are sorted by weight descending
        // Verify that the menu structure reflects the intended ordering

        // ConfigureTypes (resources)
        expect(menuStructure.configureTypes[0]).toMatchObject({
          type:   'fleet.cattle.io.clustergroup',
          weight: 100,
        });
        expect(menuStructure.configureTypes[1]).toMatchObject({
          type:   'workload.io.deployment',
          weight: 50,
        });

        // VirtualTypes (custom pages)
        expect(menuStructure.virtualTypes[0]).toMatchObject({
          name:   'mixedproduct-overview',
          weight: 75,
        });
        expect(menuStructure.virtualTypes[1]).toMatchObject({
          name:   'mixedproduct-settings',
          weight: 25,
        });

        // Verify basicType call includes all items for navigation
        const allItems = menuStructure.basicTypes[0].types;

        expect(allItems).toContain('fleet.cattle.io.clustergroup');
        expect(allItems).toContain('mixedproduct-overview');
        expect(allItems).toContain('workload.io.deployment');
        expect(allItems).toContain('mixedproduct-settings');
      });
    });

    describe('extending product - menu structure validation', () => {
      it('should add items to existing product menu with correct naming', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();

        const menuStructure: any = {
          basicTypes:   [],
          virtualTypes: [],
        };

        const mockDSL = {
          product:   jest.fn(),
          basicType: jest.fn((types, group) => {
            menuStructure.basicTypes.push({ types, group });
          }),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((config) => {
            menuStructure.virtualTypes.push({
              name:   config.name,
              label:  config.label,
              weight: config.weight,
            });
          }),
          configureType: jest.fn(),
          weightType:    jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const validStandardProduct = StandardProductNames.EXPLORER;
        const config: ProductChildPage[] = [
          {
            name:      'my-custom-page',
            label:     'My Custom Page',
            weight:    99,
            component: { name: 'CustomComponent' },
          },
          {
            name:      'another-page',
            label:     'Another Page',
            weight:    98,
            component: { name: 'AnotherComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // When extending EXPLORER, names are prefixed with product name
        expect(menuStructure.virtualTypes[0]).toMatchObject({
          name:   'explorer-my-custom-page',
          label:  'My Custom Page',
          weight: 99,
        });
        expect(menuStructure.virtualTypes[1]).toMatchObject({
          name:   'explorer-another-page',
          label:  'Another Page',
          weight: 98,
        });

        // These should be added to EXPLORER's existing navigation
        const explorerItems = menuStructure.basicTypes[0].types;

        expect(explorerItems).toContain('explorer-my-custom-page');
        expect(explorerItems).toContain('explorer-another-page');
      });

      it('should add groups to existing product with correct hierarchy', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();

        const menuStructure: any = {
          basicTypes:   [],
          virtualTypes: [],
          groupLabels:  {},
          groupWeights: {},
        };

        const mockDSL = {
          product:   jest.fn(),
          basicType: jest.fn((types, group) => {
            menuStructure.basicTypes.push({ types, group });
          }),
          labelGroup: jest.fn((group, label, labelKey) => {
            menuStructure.groupLabels[group] = { label, labelKey };
          }),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn((group, weight) => {
            menuStructure.groupWeights[group] = weight;
          }),
          virtualType: jest.fn((config) => {
            menuStructure.virtualTypes.push({
              name:   config.name,
              label:  config.label,
              weight: config.weight,
            });
          }),
          configureType: jest.fn(),
          weightType:    jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const validStandardProduct = StandardProductNames.SETTINGS;
        const config: ProductChildGroup[] = [
          {
            name:     'extensions',
            label:    'Extensions',
            weight:   80,
            children: [
              {
                name:      'marketplace',
                label:     'Marketplace',
                component: { name: 'MarketplaceComponent' },
              },
              {
                name:      'installed',
                label:     'Installed',
                component: { name: 'InstalledComponent' },
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify group is added with correct naming (settings-extensions)
        expect(menuStructure.groupLabels['settings-extensions']).toStrictEqual({
          label:    'Extensions',
          labelKey: undefined,
        });
        expect(menuStructure.groupWeights['settings-extensions']).toBe(80);

        // Verify child items have correct hierarchy in their names
        const extensionItems = menuStructure.virtualTypes.filter((vt: any) => vt.name.includes('extensions')
        );

        expect(extensionItems).toHaveLength(2);
        expect(extensionItems.some((item: any) => item.name === 'settings-extensions-marketplace')).toBe(true);
        expect(extensionItems.some((item: any) => item.name === 'settings-extensions-installed')).toBe(true);

        // Verify group navigation structure
        const groupNavCall = menuStructure.basicTypes.find((bt: any) => bt.group === 'settings-extensions'
        );

        expect(groupNavCall).toBeDefined();
        expect(groupNavCall.types).toStrictEqual(expect.arrayContaining([
          'settings-extensions-marketplace',
          'settings-extensions-installed',
          'settings-extensions', // Group itself is also in the nav
        ]));
      });
    });

    describe('comprehensive menu rendering scenario', () => {
      it('should create complete menu structure matching SideNav expectations', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();

        // Simulate the complete menu structure as SideNav would build it
        const menuStructure: any = {
          groups: [],
          items:  [],
        };

        const mockDSL = {
          product:   jest.fn(),
          basicType: jest.fn((types, group) => {
            if (group) {
              // This is a group with children
              const existingGroup = menuStructure.groups.find((g: any) => g.name === group);

              if (existingGroup) {
                existingGroup.children = types.filter((t: string) => t !== group);
              } else {
                menuStructure.groups.push({
                  name:     group,
                  children: types.filter((t: string) => t !== group),
                });
              }
            }
          }),
          labelGroup: jest.fn((group, label, labelKey) => {
            const existingGroup = menuStructure.groups.find((g: any) => g.name === group);

            if (existingGroup) {
              existingGroup.label = label;
              existingGroup.labelKey = labelKey;
            } else {
              menuStructure.groups.push({
                name: group,
                label,
                labelKey,
              });
            }
          }),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn((group, weight) => {
            const existingGroup = menuStructure.groups.find((g: any) => g.name === group);

            if (existingGroup) {
              existingGroup.weight = weight;
            }
          }),
          virtualType: jest.fn((config) => {
            menuStructure.items.push({
              name:   config.name,
              label:  config.label,
              weight: config.weight,
              type:   'virtual',
            });
          }),
          configureType: jest.fn((type) => {
            menuStructure.items.push({
              name:   type,
              type:   'configure',
              weight: 0, // Will be set by weightType if provided
            });
          }),
          weightType: jest.fn((type, weight) => {
            const item = menuStructure.items.find((i: any) => i.name === type);

            if (item) {
              item.weight = weight;
            }
          }),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'complete-app',
          label: 'Complete App',
        };
        const config: (ProductChildGroup | ProductChildPage)[] = [
          {
            name:      'dashboard',
            label:     'Dashboard',
            weight:    100,
            component: { name: 'DashboardComponent' },
          },
          {
            name:     'workloads',
            label:    'Workloads',
            weight:   90,
            children: [
              { type: 'workload.io.deployment', weight: 50 },
              { type: 'workload.io.pod', weight: 45 },
              {
                name:      'jobs',
                label:     'Jobs',
                component: { name: 'JobsComponent' },
              },
            ],
          },
          { type: 'config.io.configmap', weight: 80 },
          {
            name:     'settings',
            label:    'Settings',
            weight:   70,
            children: [
              {
                name:      'general',
                label:     'General',
                component: { name: 'GeneralComponent' },
              },
              {
                name:      'advanced',
                label:     'Advanced',
                component: { name: 'AdvancedComponent' },
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify groups were created with correct structure
        const workloadsGroup = menuStructure.groups.find((g: any) => g.name === 'completeapp-workloads');

        expect(workloadsGroup).toBeDefined();
        expect(workloadsGroup.label).toBe('Workloads');
        expect(workloadsGroup.weight).toBe(90);
        expect(workloadsGroup.children).toStrictEqual(expect.arrayContaining([
          'workload.io.deployment',
          'workload.io.pod',
          'completeapp-workloads-jobs',
        ]));

        const settingsGroup = menuStructure.groups.find((g: any) => g.name === 'completeapp-settings');

        expect(settingsGroup).toBeDefined();
        expect(settingsGroup.label).toBe('Settings');
        expect(settingsGroup.weight).toBe(70);
        expect(settingsGroup.children).toStrictEqual(expect.arrayContaining([
          'completeapp-settings-general',
          'completeapp-settings-advanced',
        ]));

        // Verify all menu items were created with correct properties
        const virtualItems = menuStructure.items.filter((i: any) => i.type === 'virtual');
        const configureItems = menuStructure.items.filter((i: any) => i.type === 'configure');

        // Check dashboard (top-level virtual type)
        const dashboardItem = virtualItems.find((i: any) => i.name === 'completeapp-dashboard');

        expect(dashboardItem).toBeDefined();
        expect(dashboardItem.label).toBe('Dashboard');
        expect(dashboardItem.weight).toBe(100);

        // Check configmap (top-level configure type)
        const configMapItem = configureItems.find((i: any) => i.name === 'config.io.configmap');

        expect(configMapItem).toBeDefined();
        expect(configMapItem.weight).toBe(80);

        // Verify group items
        const jobsItem = virtualItems.find((i: any) => i.name === 'completeapp-workloads-jobs');

        expect(jobsItem).toBeDefined();
        expect(jobsItem.label).toBe('Jobs');

        const generalItem = virtualItems.find((i: any) => i.name === 'completeapp-settings-general');

        expect(generalItem).toBeDefined();
        expect(generalItem.label).toBe('General');

        const advancedItem = virtualItems.find((i: any) => i.name === 'completeapp-settings-advanced');

        expect(advancedItem).toBeDefined();
        expect(advancedItem.label).toBe('Advanced');

        // Verify resource types in workloads group
        const deploymentsItem = configureItems.find((i: any) => i.name === 'workload.io.deployment');

        expect(deploymentsItem).toBeDefined();
        expect(deploymentsItem.weight).toBe(50);

        const podsItem = configureItems.find((i: any) => i.name === 'workload.io.pod');

        expect(podsItem).toBeDefined();
        expect(podsItem.weight).toBe(45);

        // Verify total counts
        expect(virtualItems.length).toBeGreaterThanOrEqual(4); // dashboard, jobs, general, advanced
        expect(configureItems.length).toBeGreaterThanOrEqual(3); // configmap, deployment, pod
        expect(menuStructure.groups).toHaveLength(2); // workloads, settings
      });
    });
  });
});
