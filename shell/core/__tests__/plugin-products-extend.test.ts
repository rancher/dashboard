import { PluginProduct } from '@shell/core/plugin-products';
import { IExtension } from '@shell/core/types';
import pluginProductsHelpers from '@shell/core/plugin-products-helpers';
import {
  ProductChild, ProductChildCustomPage, ProductChildPage, ProductChildResourcePage, ProductMetadata, StandardProductNames
} from '@shell/core/plugin-products-external';
import { ProductMetadataInternal } from '@shell/core/plugin-products-internal';
import { resetExtensionProductRouting } from '@shell/core/plugin-products-route-registry';

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
    _setStartRouteWithProduct:  jest.fn(),
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

function createMockDSL(): any {
  return {
    product:             jest.fn(),
    basicType:           jest.fn(),
    labelGroup:          jest.fn(),
    setGroupDefaultType: jest.fn(),
    weightGroup:         jest.fn(),
    virtualType:         jest.fn(),
    configureType:       jest.fn(),
    weightType:          jest.fn(),
    mapType:             jest.fn(),
    ignoreType:          jest.fn(),
    hideBulkActions:     jest.fn(),
    headers:             jest.fn(),
  };
}

describe('pluginProduct', () => {
  // The route registry outlives any single plugin, so it has to be cleared between tests
  beforeEach(() => {
    resetExtensionProductRouting();
    jest.clearAllMocks();
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

  // See https://github.com/rancher/dashboard/issues/19124.
  // A top level extension product routes as `<product>/c/:cluster/...`, which nothing in the core
  // router covers, so extending one has to match that shape - and has to register the generic
  // `:resource` routes when the product has no resource page of its own.
  describe('extending a top level extension product', () => {
    const TOP_LEVEL_PRODUCT = 'mytoplevelprod';

    const customPage: ProductChildCustomPage = {
      name:      'overview',
      label:     'Overview',
      component: { name: 'Overview' },
    };

    const resourcePage: ProductChildResourcePage = { type: 'some-resource' };

    const generateResourceRoutes = pluginProductsHelpers.generateResourceRoutes as jest.Mock;
    const generateConfigureTypeRoute = pluginProductsHelpers.generateConfigureTypeRoute as jest.Mock;
    const generateVirtualTypeRoute = pluginProductsHelpers.generateVirtualTypeRoute as jest.Mock;

    /** Registers `TOP_LEVEL_PRODUCT` as a top level product, which is what seeds the route registry */
    function addTopLevelProduct(plugin: IExtension, config: ProductChild[], startRouteWithProduct = true) {
      const product: ProductMetadataInternal = {
        name:       TOP_LEVEL_PRODUCT,
        label:      'My Top Level Product',
        extendable: true,
        startRouteWithProduct,
      };

      return new PluginProduct(plugin, product as ProductMetadata, config);
    }

    it('should register the generic resource routes when the product has no resource page of its own', () => {
      const mockPlugin = createMockPlugin();

      addTopLevelProduct(mockPlugin, [customPage]);
      generateResourceRoutes.mockClear();

      new PluginProduct(mockPlugin, TOP_LEVEL_PRODUCT, [resourcePage]);

      expect(generateResourceRoutes).toHaveBeenCalledWith(
        TOP_LEVEL_PRODUCT,
        resourcePage,
        { extendProduct: false, startRouteWithProduct: true }
      );
    });

    it('should point the resource page at the product prefixed route rather than the core one', () => {
      const mockPlugin = createMockPlugin();

      (mockPlugin.DSL as jest.Mock).mockReturnValue(createMockDSL());

      addTopLevelProduct(mockPlugin, [customPage]);
      generateConfigureTypeRoute.mockClear();

      new PluginProduct(mockPlugin, TOP_LEVEL_PRODUCT, [resourcePage]).apply(
        mockPlugin,
        createMockStore([TOP_LEVEL_PRODUCT])
      );

      expect(generateConfigureTypeRoute).toHaveBeenCalledWith(
        TOP_LEVEL_PRODUCT,
        resourcePage,
        { extendProduct: false, startRouteWithProduct: true }
      );
    });

    it('should register a custom page under the product prefixed path', () => {
      const mockPlugin = createMockPlugin();

      addTopLevelProduct(mockPlugin, [customPage]);
      generateVirtualTypeRoute.mockClear();

      const extraPage: ProductChildCustomPage = {
        name:      'extra',
        label:     'Extra',
        component: { name: 'Extra' },
      };

      new PluginProduct(mockPlugin, TOP_LEVEL_PRODUCT, [extraPage]);

      expect(generateVirtualTypeRoute).toHaveBeenCalledWith(
        TOP_LEVEL_PRODUCT,
        'extra',
        {
          component: extraPage.component, extendProduct: false, startRouteWithProduct: true
        }
      );
    });

    it('should mark the extending plugin as owning a product prefixed top level product', () => {
      const mockPlugin = createMockPlugin();
      const extendingPlugin = createMockPlugin();

      addTopLevelProduct(mockPlugin, [customPage]);

      new PluginProduct(extendingPlugin, TOP_LEVEL_PRODUCT, [resourcePage]);

      expect(extendingPlugin._registerTopLevelProduct).toHaveBeenCalledWith(TOP_LEVEL_PRODUCT);
      expect(extendingPlugin._setStartRouteWithProduct).toHaveBeenCalledWith(TOP_LEVEL_PRODUCT, true);
    });

    it('should not register the generic resource routes when the product already has a resource page', () => {
      const mockPlugin = createMockPlugin();

      addTopLevelProduct(mockPlugin, [{ type: 'existing-resource' }]);
      generateResourceRoutes.mockClear();

      new PluginProduct(mockPlugin, TOP_LEVEL_PRODUCT, [resourcePage]);

      expect(generateResourceRoutes).not.toHaveBeenCalled();
    });

    it('should not register the generic resource routes twice when two registrations extend the same product', () => {
      const mockPlugin = createMockPlugin();

      addTopLevelProduct(mockPlugin, [customPage]);

      new PluginProduct(mockPlugin, TOP_LEVEL_PRODUCT, [resourcePage]);
      generateResourceRoutes.mockClear();

      new PluginProduct(mockPlugin, TOP_LEVEL_PRODUCT, [{ type: 'another-resource' }]);

      expect(generateResourceRoutes).not.toHaveBeenCalled();
    });

    it('should use the cluster prefixed shape for a product registered with startRouteWithProduct false', () => {
      const mockPlugin = createMockPlugin();
      const extendingPlugin = createMockPlugin();

      addTopLevelProduct(mockPlugin, [customPage], false);

      new PluginProduct(extendingPlugin, TOP_LEVEL_PRODUCT, [resourcePage]);

      expect(generateResourceRoutes).toHaveBeenCalledWith(
        TOP_LEVEL_PRODUCT,
        resourcePage,
        { extendProduct: false, startRouteWithProduct: false }
      );
      expect(extendingPlugin._registerTopLevelProduct).not.toHaveBeenCalled();
      expect(extendingPlugin._setStartRouteWithProduct).toHaveBeenCalledWith(TOP_LEVEL_PRODUCT, false);
    });

    describe('when the product name has dashes', () => {
      // `addProduct` strips the dashes, but extension authors will pass the name as they wrote it
      const DASHED_PRODUCT = 'my-top-level-prod';

      function addDashedTopLevelProduct(plugin: IExtension) {
        const product: ProductMetadata = {
          name:       DASHED_PRODUCT,
          label:      'My Top Level Product',
          extendable: true,
        };

        return new PluginProduct(plugin, product, [customPage]);
      }

      it('should find the product in the route registry and register its generic resource routes', () => {
        const mockPlugin = createMockPlugin();

        addDashedTopLevelProduct(mockPlugin);
        generateResourceRoutes.mockClear();

        new PluginProduct(mockPlugin, DASHED_PRODUCT, [resourcePage]);

        expect(generateResourceRoutes).toHaveBeenCalledWith(
          TOP_LEVEL_PRODUCT,
          resourcePage,
          { extendProduct: false, startRouteWithProduct: true }
        );
      });

      it('should report the same product name that addProduct registered', () => {
        const mockPlugin = createMockPlugin();

        addDashedTopLevelProduct(mockPlugin);

        const extending = new PluginProduct(mockPlugin, DASHED_PRODUCT, [resourcePage]);

        expect(extending.productName).toBe(TOP_LEVEL_PRODUCT);
      });

      it('should keep the dashes for a product that was not registered via addProduct', () => {
        // Legacy DSL products keep their dashes in the type-map, e.g. `harvester-manager`
        const extending = new PluginProduct(createMockPlugin(), DASHED_PRODUCT, [resourcePage]);

        expect(extending.productName).toBe(DASHED_PRODUCT);
      });

      it('should pass the extendable check when applied', () => {
        const mockPlugin = createMockPlugin();

        (mockPlugin.DSL as jest.Mock).mockReturnValue(createMockDSL());

        addDashedTopLevelProduct(mockPlugin);

        const extending = new PluginProduct(mockPlugin, DASHED_PRODUCT, [resourcePage]);

        expect(() => extending.apply(mockPlugin, createMockStore([TOP_LEVEL_PRODUCT]))).not.toThrow();
      });
    });

    // `extendProduct` called before `addProduct` in the same extension, or an extension extending a
    // product owned by one that loaded after it
    describe('when the product is registered after the extend', () => {
      type PluginRecordingRoutes = IExtension & { routes: { parent?: string, route: any }[] };

      /** `apply` reads back the routes the plugin recorded, so they have to be recorded */
      function createMockPluginRecordingRoutes(): PluginRecordingRoutes {
        const plugin = createMockPlugin() as PluginRecordingRoutes;

        plugin.routes = [];
        (plugin.addRoute as jest.Mock).mockImplementation((route) => plugin.routes.push({ route }));
        (plugin.DSL as jest.Mock).mockReturnValue(createMockDSL());

        return plugin;
      }

      /** Extends `TOP_LEVEL_PRODUCT` and only then registers it, the order that used to break */
      function extendThenAdd(plugin: IExtension, productName = TOP_LEVEL_PRODUCT) {
        const extending = new PluginProduct(plugin, productName, [resourcePage]);

        addTopLevelProduct(plugin, [customPage]);
        jest.clearAllMocks();

        return extending;
      }

      it('should generate the product prefixed resource routes when applied', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const extending = extendThenAdd(mockPlugin);

        extending.apply(mockPlugin, createMockStore([TOP_LEVEL_PRODUCT]), jest.fn());

        expect(generateResourceRoutes).toHaveBeenCalledWith(
          TOP_LEVEL_PRODUCT,
          resourcePage,
          { extendProduct: false, startRouteWithProduct: true }
        );
      });

      it('should hand the generated routes to vue-router straight away', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const extending = extendThenAdd(mockPlugin);
        const addLateRoutes = jest.fn();

        extending.apply(mockPlugin, createMockStore([TOP_LEVEL_PRODUCT]), addLateRoutes);

        expect(addLateRoutes.mock.calls[0][0].map((r: { route: { name: string } }) => r.route.name)).toStrictEqual([
          `${ TOP_LEVEL_PRODUCT }-${ resourcePage.type }-list`,
          `${ TOP_LEVEL_PRODUCT }-${ resourcePage.type }-detail`,
        ]);
      });

      it('should point the resource page at the product prefixed route', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const extending = extendThenAdd(mockPlugin);

        extending.apply(mockPlugin, createMockStore([TOP_LEVEL_PRODUCT]), jest.fn());

        expect(generateConfigureTypeRoute).toHaveBeenCalledWith(
          TOP_LEVEL_PRODUCT,
          resourcePage,
          { extendProduct: false, startRouteWithProduct: true }
        );
      });

      it('should mark the plugin as owning a product prefixed top level product', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const extending = extendThenAdd(mockPlugin);

        extending.apply(mockPlugin, createMockStore([TOP_LEVEL_PRODUCT]), jest.fn());

        expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledWith(TOP_LEVEL_PRODUCT);
      });

      it('should switch the plugin to the product prefixed route shape for the product', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const extending = extendThenAdd(mockPlugin);

        extending.apply(mockPlugin, createMockStore([TOP_LEVEL_PRODUCT]), jest.fn());

        expect(mockPlugin._setStartRouteWithProduct).toHaveBeenLastCalledWith(TOP_LEVEL_PRODUCT, true);
      });

      it('should switch to the name addProduct registered when the extend passed it with dashes', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const extending = extendThenAdd(mockPlugin, 'my-top-level-prod');

        extending.apply(mockPlugin, createMockStore([TOP_LEVEL_PRODUCT]), jest.fn());

        expect(extending.productName).toBe(TOP_LEVEL_PRODUCT);
      });

      it('should not add routes to vue-router when the product was registered before the extend', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const addLateRoutes = jest.fn();

        addTopLevelProduct(mockPlugin, [customPage]);

        new PluginProduct(mockPlugin, TOP_LEVEL_PRODUCT, [resourcePage]).apply(mockPlugin, createMockStore([TOP_LEVEL_PRODUCT]), addLateRoutes);

        expect(addLateRoutes).not.toHaveBeenCalled();
      });

      it('should not add routes to vue-router when extending a core product', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const addLateRoutes = jest.fn();

        new PluginProduct(mockPlugin, StandardProductNames.EXPLORER, [resourcePage]).apply(mockPlugin, createMockStore(), addLateRoutes);

        expect(addLateRoutes).not.toHaveBeenCalled();
      });

      it('should not add routes to vue-router when the product is not extendable', () => {
        const mockPlugin = createMockPluginRecordingRoutes();
        const extending = extendThenAdd(mockPlugin);
        const addLateRoutes = jest.fn();

        expect(() => extending.apply(mockPlugin, createMockStore([]), addLateRoutes)).toThrow('is not extendable');
        expect(addLateRoutes).not.toHaveBeenCalled();
      });
    });
  });

  // Regression guard for https://github.com/rancher/dashboard/issues/18749. Adding
  // `c/:cluster/explorer/:resource` shadows explorer's own `c/:cluster/:product/projectsnamespaces`,
  // because the static product segment outranks the core dynamic one.
  describe('extending a core product with a resource page', () => {
    const resourcePage: ProductChildResourcePage = { type: 'some-resource' };

    it('should not register any generic resource routes', () => {
      const mockPlugin = createMockPlugin();

      new PluginProduct(mockPlugin, StandardProductNames.EXPLORER, [resourcePage]);

      expect(pluginProductsHelpers.generateResourceRoutes).not.toHaveBeenCalled();
      expect(mockPlugin.addRoute).not.toHaveBeenCalled();
    });

    it('should point the resource page at the core c-cluster-product-resource route', () => {
      const mockPlugin = createMockPlugin();

      (mockPlugin.DSL as jest.Mock).mockReturnValue(createMockDSL());

      new PluginProduct(mockPlugin, StandardProductNames.EXPLORER, [resourcePage]).apply(mockPlugin, createMockStore());

      expect(pluginProductsHelpers.generateConfigureTypeRoute).toHaveBeenCalledWith(
        StandardProductNames.EXPLORER,
        resourcePage,
        { extendProduct: true, startRouteWithProduct: false }
      );
      expect(mockPlugin._registerTopLevelProduct).not.toHaveBeenCalled();
    });
  });
});
