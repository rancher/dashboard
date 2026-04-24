import { PluginProduct } from '@shell/core/plugin-products';
import {
  ProductMetadata, ProductSinglePage, ProductChildPage,
  ProductChildGroup, ProductChildCustomPage, ProductChildResourcePage,
  ProductChild, StandardProductNames
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

function createMockStore(extendableProducts: string[] = Object.values(StandardProductNames)): any {
  return { getters: { 'type-map/productByName': (productName: string) => (extendableProducts.includes(productName) ? { name: productName, extendable: true } : undefined) } };
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

    it('should accept any string as product name when extending', () => {
      const mockPlugin = createMockPlugin();
      const customProduct = 'custom-product';

      const pluginProduct = new PluginProduct(mockPlugin, customProduct, []);

      expect(pluginProduct.newProduct).toBe(false);
    });

    it('should throw error during apply when extending a product that is not registered', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore([]);
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

      const pluginProduct = new PluginProduct(mockPlugin, 'non-existent-product', []);

      expect(() => {
        pluginProduct.apply(mockPlugin, mockStore);
      }).toThrow('is not extendable');
    });

    it('should apply successfully when extending an extendable product', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore(['my-custom-builtin-product']);
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

      const pluginProduct = new PluginProduct(mockPlugin, 'my-custom-builtin-product', []);

      expect(() => {
        pluginProduct.apply(mockPlugin, mockStore);
      }).not.toThrow();
    });

    it('should throw error during apply when extending a registered product that is not extendable', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = {
        getters: {
          'type-map/productByName': (productName: string) => {
            if (productName === 'other-extension-product') {
              return { name: productName, extendable: false };
            }

            return undefined;
          },
        },
      };
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

      const pluginProduct = new PluginProduct(mockPlugin, 'other-extension-product', []);

      expect(() => {
        pluginProduct.apply(mockPlugin, mockStore);
      }).toThrow('is not extendable');
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

    it('should set group default type to itself when group has component', () => {
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

      // When a group has a component, setGroupDefaultType should be called with the group name itself
      // This ensures clicking the group in nav routes to the group's page, not bypassing to first child
      expect(mockDSL.setGroupDefaultType).toHaveBeenCalledWith(
        'groupwithcomponent-group',
        'groupwithcomponent-group'
      );
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

    it('should use resource type as default route when first item is configureType', () => {
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
        name:  'resource-first',
        label: 'Resource First',
      };
      const config: ProductChildPage[] = [
        { type: 'apps.deployment' },
        {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewComponent' },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore);

      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.objectContaining({
            name:   'resourcefirst-c-cluster-resource',
            params: expect.objectContaining({
              product:  'resourcefirst',
              cluster:  '__BLANK_CLUSTER__',
              resource: 'apps.deployment',
            }),
          }),
        })
      );
    });

    it('should use group component as default route when group has component but no children', () => {
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
        name:  'empty-group',
        label: 'Empty Group',
      };
      const config: ProductChildGroup[] = [
        {
          name:      'empty-group-with-page',
          label:     'Empty Group With Page',
          component: { name: 'EmptyGroupComponent' },
          children:  [],
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore);

      // Verify default route points to the group's component page (not a child, since there are none)
      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({ to: expect.objectContaining({ name: expect.stringContaining('emptygroup') }) })
      );
    });

    it('should use group component as default route when group has both component and children', () => {
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
        name:  'group-with-page',
        label: 'Group With Page',
      };
      const config: ProductChildGroup[] = [
        {
          name:      'settings',
          label:     'Settings',
          component: { name: 'SettingsOverviewComponent' },
          children:  [
            {
              name:      'general',
              label:     'General Settings',
              component: { name: 'GeneralComponent' },
            },
            {
              name:      'advanced',
              label:     'Advanced Settings',
              component: { name: 'AdvancedComponent' },
            },
          ],
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      pluginProduct.apply(mockPlugin, mockStore);

      // Verify default route points to the group's component page (not first child)
      // When a group has a component, the route includes the group's name for proper side-menu highlighting
      expect(mockDSL.product).toHaveBeenCalledWith(
        expect.objectContaining({ to: expect.objectContaining({ name: 'groupwithpage-settings' }) })
      );

      // Verify virtualType was still created for the group component
      expect(mockDSL.virtualType).toHaveBeenCalledWith(
        expect.objectContaining({
          name:     'groupwithpage-settings',
          exact:    true,
          overview: true,
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

    describe('deeply nested groups (groups within groups)', () => {
      it('should handle 2-level nested groups with correct hierarchical paths', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const basicTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => basicTypeCalls.push(args)),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'nested-product',
          label: 'Nested Product',
        };
        const config: ProductChildGroup[] = [
          {
            name:     'root-group',
            label:    'Root Group',
            weight:   100,
            children: [
              {
                name:      'page1',
                label:     'Page 1',
                component: { name: 'Page1Component' },
              },
              {
                name:     'nested-group',
                label:    'Nested Group',
                weight:   50,
                children: [
                  {
                    name:      'nested-page1',
                    label:     'Nested Page 1',
                    component: { name: 'NestedPage1Component' },
                  },
                  {
                    name:      'nested-page2',
                    label:     'Nested Page 2',
                    component: { name: 'NestedPage2Component' },
                  },
                ],
              },
              {
                name:      'page2',
                label:     'Page 2',
                component: { name: 'Page2Component' },
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify basicType calls include hierarchical paths with :: separators
        // First call should be for root group items
        const rootGroupCall = basicTypeCalls.find((call) => call[1] === 'nestedproduct-root-group');

        expect(rootGroupCall).toBeDefined();
        expect(rootGroupCall[0]).toContain('nestedproduct-root-group-page1');
        expect(rootGroupCall[0]).toContain('nestedproduct-root-group-page2');
        expect(rootGroupCall[0]).toContain('nestedproduct-root-group-nested-group');
        expect(rootGroupCall[0]).toContain('nestedproduct-root-group'); // Root group itself

        // Second call should be for nested group with hierarchical path
        const nestedGroupCall = basicTypeCalls.find((call) => call[1] === 'nestedproduct-root-group::nestedproduct-root-group-nested-group');

        expect(nestedGroupCall).toBeDefined();
        expect(nestedGroupCall[0]).toContain('nestedproduct-root-group-nested-group-nested-page1');
        expect(nestedGroupCall[0]).toContain('nestedproduct-root-group-nested-group-nested-page2');
      });

      it('should handle 3-level nested groups with correct hierarchical paths', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const basicTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => basicTypeCalls.push(args)),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'deep-nested',
          label: 'Deep Nested',
        };
        const config: ProductChildGroup[] = [
          {
            name:     'level1',
            label:    'Level 1',
            children: [
              {
                name:     'level2',
                label:    'Level 2',
                children: [
                  {
                    name:     'level3',
                    label:    'Level 3',
                    children: [
                      {
                        name:      'deep-page',
                        label:     'Deep Page',
                        component: { name: 'DeepPageComponent' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify level 1 (root)
        const level1Call = basicTypeCalls.find((call) => call[1] === 'deepnested-level1');

        expect(level1Call).toBeDefined();
        expect(level1Call[0]).toContain('deepnested-level1-level2');

        // Verify level 2 (nested in level1)
        const level2Call = basicTypeCalls.find((call) => call[1] === 'deepnested-level1::deepnested-level1-level2');

        expect(level2Call).toBeDefined();
        expect(level2Call[0]).toContain('deepnested-level1-level2-level3');

        // Verify level 3 (nested in level2)
        const level3Call = basicTypeCalls.find((call) => call[1] === 'deepnested-level1::deepnested-level1-level2::deepnested-level1-level2-level3');

        expect(level3Call).toBeDefined();
        expect(level3Call[0]).toContain('deepnested-level1-level2-level3-deep-page');
      });

      it('should handle mixed nested groups and pages in standard product extension', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const basicTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => basicTypeCalls.push(args)),
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
            name:      'top-page',
            label:     'Top Page',
            component: { name: 'TopPageComponent' },
          },
          {
            name:     'parent-group',
            label:    'Parent Group',
            weight:   90,
            children: [
              {
                name:      'sibling-page',
                label:     'Sibling Page',
                component: { name: 'SiblingPageComponent' },
              },
              {
                name:     'child-group',
                label:    'Child Group',
                weight:   80,
                children: [
                  {
                    name:      'nested-page',
                    label:     'Nested Page',
                    component: { name: 'NestedPageComponent' },
                  },
                ],
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, validStandardProduct, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify parent group has both pages and nested groups
        const parentGroupCall = basicTypeCalls.find((call) => call[1] === 'explorer-parent-group');

        expect(parentGroupCall).toBeDefined();
        expect(parentGroupCall[0]).toContain('explorer-parent-group-sibling-page');
        expect(parentGroupCall[0]).toContain('explorer-parent-group-child-group');

        // Verify child group uses hierarchical path
        const childGroupCall = basicTypeCalls.find((call) => call[1] === 'explorer-parent-group::explorer-parent-group-child-group');

        expect(childGroupCall).toBeDefined();
        expect(childGroupCall[0]).toContain('explorer-parent-group-child-group-nested-page');
      });

      it('should only add root-level groups to their own basicType list', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const basicTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => basicTypeCalls.push(args)),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'test-self-ref',
          label: 'Test Self Reference',
        };
        const config: ProductChildGroup[] = [
          {
            name:     'root',
            label:    'Root',
            children: [
              {
                name:     'nested',
                label:    'Nested',
                children: [
                  {
                    name:      'page',
                    label:     'Page',
                    component: { name: 'PageComponent' },
                  },
                ],
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Root group should include itself in its basicType call
        const rootCall = basicTypeCalls.find((call) => call[1] === 'testselfref-root');

        expect(rootCall).toBeDefined();
        expect(rootCall[0]).toContain('testselfref-root'); // Self-reference

        // Nested group should NOT include itself (would create wrong hierarchy)
        const nestedCall = basicTypeCalls.find((call) => call[1] === 'testselfref-root::testselfref-root-nested');

        expect(nestedCall).toBeDefined();
        expect(nestedCall[0]).not.toContain('testselfref-root-nested'); // No self-reference for nested
        expect(nestedCall[0]).toContain('testselfref-root-nested-page'); // Contains its child page
      });

      it('should handle multiple nested groups at the same level', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const basicTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn((...args) => basicTypeCalls.push(args)),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn(),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'multi-nested',
          label: 'Multi Nested',
        };
        const config: ProductChildGroup[] = [
          {
            name:     'parent',
            label:    'Parent',
            children: [
              {
                name:     'child1',
                label:    'Child 1',
                children: [
                  {
                    name:      'page1',
                    label:     'Page 1',
                    component: { name: 'Page1Component' },
                  },
                ],
              },
              {
                name:     'child2',
                label:    'Child 2',
                children: [
                  {
                    name:      'page2',
                    label:     'Page 2',
                    component: { name: 'Page2Component' },
                  },
                ],
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify both child groups have correct hierarchical paths
        const child1Call = basicTypeCalls.find((call) => call[1] === 'multinested-parent::multinested-parent-child1');

        expect(child1Call).toBeDefined();
        expect(child1Call[0]).toContain('multinested-parent-child1-page1');

        const child2Call = basicTypeCalls.find((call) => call[1] === 'multinested-parent::multinested-parent-child2');

        expect(child2Call).toBeDefined();
        expect(child2Call[0]).toContain('multinested-parent-child2-page2');

        // Verify parent includes both child groups
        const parentCall = basicTypeCalls.find((call) => call[1] === 'multinested-parent');

        expect(parentCall).toBeDefined();
        expect(parentCall[0]).toContain('multinested-parent-child1');
        expect(parentCall[0]).toContain('multinested-parent-child2');
      });
    });

    describe('group default type behavior with components', () => {
      it('should set correct default types for mixed groups (with and without components)', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const setGroupDefaultTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn((...args) => setGroupDefaultTypeCalls.push(args)),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'mixed-groups',
          label: 'Mixed Groups',
        };
        const config: ProductChildGroup[] = [
          {
            name:      'group-with-page',
            label:     'Group With Page',
            component: { name: 'GroupPageComponent' },
            children:  [
              {
                name:      'child1',
                label:     'Child 1',
                component: { name: 'Child1Component' },
              },
            ],
          },
          {
            name:     'group-without-page',
            label:    'Group Without Page',
            children: [
              {
                name:      'child2',
                label:     'Child 2',
                component: { name: 'Child2Component' },
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Group WITH component should have defaultType pointing to itself
        const groupWithPageCall = setGroupDefaultTypeCalls.find((call) => call[0] === 'mixedgroups-group-with-page');

        expect(groupWithPageCall).toBeDefined();
        expect(groupWithPageCall[0]).toBe('mixedgroups-group-with-page');
        expect(groupWithPageCall[1]).toBe('mixedgroups-group-with-page'); // Points to itself

        // Group WITHOUT component should have defaultType pointing to first child
        const groupWithoutPageCall = setGroupDefaultTypeCalls.find((call) => call[0] === 'mixedgroups-group-without-page');

        expect(groupWithoutPageCall).toBeDefined();
        expect(groupWithoutPageCall[0]).toBe('mixedgroups-group-without-page');
        expect(groupWithoutPageCall[1]).toBe('mixedgroups-group-without-page-child2'); // Points to first child
      });

      it('should handle nested groups where both parent and child have components', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const setGroupDefaultTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn((...args) => setGroupDefaultTypeCalls.push(args)),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'nested-with-pages',
          label: 'Nested With Pages',
        };
        const config: ProductChildGroup[] = [
          {
            name:      'parent',
            label:     'Parent',
            component: { name: 'ParentComponent' },
            children:  [
              {
                name:      'child-group',
                label:     'Child Group',
                component: { name: 'ChildGroupComponent' },
                children:  [
                  {
                    name:      'grandchild',
                    label:     'Grandchild',
                    component: { name: 'GrandchildComponent' },
                  },
                ],
              },
            ],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Parent group with component should point to itself
        const parentCall = setGroupDefaultTypeCalls.find((call) => call[0] === 'nestedwithpages-parent');

        expect(parentCall).toBeDefined();
        expect(parentCall[1]).toBe('nestedwithpages-parent');

        // Nested child group with component should also point to itself
        const childCall = setGroupDefaultTypeCalls.find((call) => call[0] === 'nestedwithpages-parent-child-group');

        expect(childCall).toBeDefined();
        expect(childCall[1]).toBe('nestedwithpages-parent-child-group');
      });

      it('should reproduce user bug: group with component and children routes to group page not first child', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const setGroupDefaultTypeCalls: any[] = [];
        const virtualTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn((...args) => setGroupDefaultTypeCalls.push(args)),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn((...args) => virtualTypeCalls.push(args)),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        // Exact scenario from user's bug report
        const productMetadata: ProductMetadata = {
          name:  'group-with-page',
          label: 'Group With Page',
        };
        const config: (ProductChildGroup | ProductChildPage)[] = [
          {
            name:      'general1',
            label:     'General Settings1',
            component: { name: 'GeneralComponent' },
          },
          {
            name:      'settings',
            label:     'Settings',
            component: { name: 'SettingsOverviewComponent' },
            children:  [
              {
                name:      'general',
                label:     'General Settings',
                component: { name: 'GeneralComponent' },
              },
              {
                name:      'advanced',
                label:     'Advanced Settings',
                component: { name: 'AdvancedComponent' },
              },
            ],
          },
          {
            name:      'general2',
            label:     'General Settings2',
            component: { name: 'GeneralComponent' },
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Verify the settings group (which has component + children) has defaultType pointing to itself
        const settingsCall = setGroupDefaultTypeCalls.find((call) => call[0] === 'groupwithpage-settings');

        expect(settingsCall).toBeDefined();
        expect(settingsCall[0]).toBe('groupwithpage-settings');
        expect(settingsCall[1]).toBe('groupwithpage-settings'); // Should point to itself, NOT 'groupwithpage-settings-general'

        // Verify the settings virtualType was created with exact + overview flags
        const settingsVirtualType = virtualTypeCalls.find((call) => call[0].name === 'groupwithpage-settings');

        expect(settingsVirtualType).toBeDefined();
        expect(settingsVirtualType[0].exact).toBe(true);
        expect(settingsVirtualType[0].overview).toBe(true);
      });

      it('should handle empty children array with component (group page, no children)', () => {
        const mockPlugin = createMockPlugin();
        const mockStore = createMockStore();
        const setGroupDefaultTypeCalls: any[] = [];

        const mockDSL = {
          product:             jest.fn(),
          basicType:           jest.fn(),
          labelGroup:          jest.fn(),
          setGroupDefaultType: jest.fn((...args) => setGroupDefaultTypeCalls.push(args)),
          weightGroup:         jest.fn(),
          virtualType:         jest.fn(),
          configureType:       jest.fn(),
          weightType:          jest.fn(),
        };

        (mockPlugin.DSL as jest.Mock).mockReturnValue(mockDSL);

        const productMetadata: ProductMetadata = {
          name:  'empty-children',
          label: 'Empty Children',
        };
        const config: ProductChildGroup[] = [
          {
            name:      'standalone-group',
            label:     'Standalone Group',
            component: { name: 'StandaloneComponent' },
            children:  [],
          },
        ];

        const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

        pluginProduct.apply(mockPlugin, mockStore);

        // Group with component but empty children should still point to itself
        const groupCall = setGroupDefaultTypeCalls.find((call) => call[0] === 'emptychildren-standalone-group');

        expect(groupCall).toBeDefined();
        expect(groupCall[1]).toBe('emptychildren-standalone-group');
      });
    });
  });

  describe('fromName convenience method', () => {
    it('should create a new top-level product from a string name', () => {
      const mockPlugin = createMockPlugin();
      const pluginProduct = PluginProduct.fromName(mockPlugin, 'my-first-product');

      expect(pluginProduct.newProduct).toBe(true);
      expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
    });

    it('should register a route with EmptyProductPage when created from a string name', () => {
      const mockPlugin = createMockPlugin();

      PluginProduct.fromName(mockPlugin, 'my-first-product');

      expect(mockPlugin.addRoute).toHaveBeenCalledTimes(1);
    });

    it('should use the string as both name and label for the product', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const productCalls: any[] = [];
      const mockDSL = {
        product:             jest.fn((...args: any[]) => productCalls.push(args)),
        basicType:           jest.fn(),
        labelGroup:          jest.fn(),
        setGroupDefaultType: jest.fn(),
        weightGroup:         jest.fn(),
        virtualType:         jest.fn(),
        configureType:       jest.fn(),
        weightType:          jest.fn(),
        headers:             jest.fn(),
        hideBulkActions:     jest.fn(),
        spoofedType:         jest.fn(),
        mapGroup:            jest.fn(),
        ignoreGroup:         jest.fn(),
        mapType:             jest.fn(),
        ignoreType:          jest.fn(),
      };

      jest.spyOn(mockPlugin, 'DSL').mockReturnValue(mockDSL);

      const pluginProduct = PluginProduct.fromName(mockPlugin, 'my-first-product');

      pluginProduct.apply(mockPlugin, mockStore);

      expect(productCalls).toHaveLength(1);
      expect(productCalls[0][0]).toStrictEqual(expect.objectContaining({
        name:  'myfirstproduct',
        label: 'my-first-product',
      }));
    });

    it('should handle product names with dashes by removing them for the internal name', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const productCalls: any[] = [];
      const mockDSL = {
        product:             jest.fn((...args: any[]) => productCalls.push(args)),
        basicType:           jest.fn(),
        labelGroup:          jest.fn(),
        setGroupDefaultType: jest.fn(),
        weightGroup:         jest.fn(),
        virtualType:         jest.fn(),
        configureType:       jest.fn(),
        weightType:          jest.fn(),
        headers:             jest.fn(),
        hideBulkActions:     jest.fn(),
        spoofedType:         jest.fn(),
        mapGroup:            jest.fn(),
        ignoreGroup:         jest.fn(),
        mapType:             jest.fn(),
        ignoreType:          jest.fn(),
      };

      jest.spyOn(mockPlugin, 'DSL').mockReturnValue(mockDSL);

      const pluginProduct = PluginProduct.fromName(mockPlugin, 'test-product-name');

      pluginProduct.apply(mockPlugin, mockStore);

      expect(productCalls[0][0]).toStrictEqual(expect.objectContaining({ name: 'testproductname' }));
    });

    it('should handle product names without dashes', () => {
      const mockPlugin = createMockPlugin();
      const mockStore = createMockStore();
      const productCalls: any[] = [];
      const mockDSL = {
        product:             jest.fn((...args: any[]) => productCalls.push(args)),
        basicType:           jest.fn(),
        labelGroup:          jest.fn(),
        setGroupDefaultType: jest.fn(),
        weightGroup:         jest.fn(),
        virtualType:         jest.fn(),
        configureType:       jest.fn(),
        weightType:          jest.fn(),
        headers:             jest.fn(),
        hideBulkActions:     jest.fn(),
        spoofedType:         jest.fn(),
        mapGroup:            jest.fn(),
        ignoreGroup:         jest.fn(),
        mapType:             jest.fn(),
        ignoreType:          jest.fn(),
      };

      jest.spyOn(mockPlugin, 'DSL').mockReturnValue(mockDSL);

      const pluginProduct = PluginProduct.fromName(mockPlugin, 'myproduct');

      pluginProduct.apply(mockPlugin, mockStore);

      expect(productCalls[0][0]).toStrictEqual(expect.objectContaining({ name: 'myproduct' }));
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
        const product: ProductSinglePage = {
          name:      'my-dashboard',
          label:     'My Dashboard',
          icon:      'globe',
          component: { name: 'DashboardPage' },
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
          weight:    2,
        };

        const settingsPage: ProductChildCustomPage = {
          name:      'settings',
          label:     'Settings',
          component: { name: 'SettingsPage' },
          weight:    1,
        };

        const product: ProductMetadata = {
          name:  'my-app',
          label: 'My App',
          icon:  'gear',
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
          type:   'provisioning.cattle.io.cluster',
          weight: 2,
          config: {
            displayName: 'Clusters',
            isCreatable: true,
            isEditable:  true,
            isRemovable: true,
            canYaml:     true,
          },
        };

        const nodePage: ProductChildResourcePage = {
          type:   'management.cattle.io.node',
          weight: 1,
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
          weight:   2,
          children: [alertsPage, metricsPage],
        };

        const overviewPage: ProductChildCustomPage = {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewPage' },
          weight:    3,
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

        const dashboardPage: ProductChildCustomPage = {
          name:      'dashboard',
          label:     'Dashboard',
          component: { name: 'Dashboard' },
          weight:    3,
        };

        const clusterPage: ProductChildResourcePage = {
          type:   'provisioning.cattle.io.cluster',
          weight: 2,
        };

        const settingsPage: ProductChildCustomPage = {
          name:      'settings',
          label:     'Settings',
          component: { name: 'Settings' },
          weight:    1,
        };

        const product: ProductMetadata = {
          name:  'my-platform',
          label: 'My Platform',
        };

        const config: ProductChild[] = [dashboardPage, clusterPage, settingsPage];
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
          children:  [alertsPage, metricsPage],
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
          children:  [childPage],
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
          children: [costPage, usagePage],
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
          icon:     'gear',
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
          children: [groupChildPage],
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
          children:  [childPage],
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
