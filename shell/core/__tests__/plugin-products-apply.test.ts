import { PluginProduct } from '@shell/core/plugin-products';
import { IExtension } from '@shell/core/types';
import { ProductChildGroup, ProductChildPage, ProductMetadata, StandardProductNames } from '@shell/core/plugin-products-external';

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
          sideMenu:  { weight: 10 },
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
          type:     'custom.resource',
          sideMenu: { weight: 5 },
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
          sideMenu: {
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
          }

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
          sideMenu: {
            children: [
              {
                name:      'child1',
                label:     'Child 1',
                component: { name: 'Child1Component' },
              },
            ],
          }

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
          sideMenu:  {
            children: [
              {
                name:      'child1',
                label:     'Child 1',
                component: { name: 'Child1Component' },
              },
            ],
          }

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
          sideMenu: {
            weight:   50,
            children: [
              {
                name:      'child',
                label:     'Child',
                component: { name: 'ChildComponent' },
              },
            ],
          },
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
          sideMenu:  { weight: 1 },
        },
        {
          name:      'second',
          label:     'Second',
          component: { name: 'SecondComponent' },
          sideMenu:  { weight: 2 },
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
          sideMenu: {
            children: [
              {
                name:      'general',
                label:     'General',
                component: { name: 'GeneralComponent' },
              },
            ]
          },

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
          sideMenu: {
            children: [
              { type: 'provisioning.cattle.io.cluster' },
            ],
          }

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
        { type: 'apps.deployment', sideMenu: { weight: 1 } },
        {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewComponent' },
          sideMenu:  { weight: 2 },
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
          sideMenu:  { children: [] }

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
          sideMenu:  {
            children: [
              {
                name:      'general',
                label:     'General Settings',
                component: { name: 'GeneralComponent' },
              },
              {
                name:      'advanced',
                label:     'Advanced Settings',
                component: { name: 'AdvancedComponent ' },
              },
            ],
          }

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
});
