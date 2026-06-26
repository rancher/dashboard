import { PluginProduct } from '@shell/core/plugin-products';
import { Plugin } from '@shell/core/plugin';
import { IExtension } from '@shell/core/types';
import { ProductChildPage, ProductMetadata, ProductMetadataSinglePage, StandardProductNames } from '@shell/core/plugin-products-external';

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
  describe('new product scenarios', () => {
    it('should create a new product with config items', () => {
      const mockPlugin = createMockPlugin();
      const productMetadata: ProductMetadata = {
        name:    'test-product',
        label:   'Test Product',
        sideBar: { icon: { name: 'icon-test' } }
      };
      const config: ProductChildPage[] = [
        {
          name:      'overview',
          label:     'Overview',
          component: { name: 'OverviewPage' },
          sideMenu:  { weight: 1 },
        },
        {
          name:      'details',
          label:     'Details',
          component: { name: 'DetailsPage' },
          sideMenu:  { weight: 2 },
        },
      ];

      const pluginProduct = new PluginProduct(mockPlugin, productMetadata, config);

      expect(pluginProduct.newProduct).toBe(true);
      expect(mockPlugin._registerTopLevelProduct).toHaveBeenCalledTimes(1);
      expect(mockPlugin.addRoute).toHaveBeenCalledTimes(2);
    });

    it('should create a single page product', () => {
      const mockPlugin = createMockPlugin();
      const productSinglePage: ProductMetadataSinglePage = {
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
      const invalidProduct: Partial<ProductMetadata> = { label: 'No Name' };

      expect(() => {
        new PluginProduct(mockPlugin, invalidProduct as ProductMetadata, []);
      }).toThrow('Invalid product');
    });

    it('should throw error when product type is invalid', () => {
      const mockPlugin = createMockPlugin();

      expect(() => {
        new PluginProduct(mockPlugin, {} as ProductMetadata, []);
      }).toThrow('Invalid product');
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
        moveType:            jest.fn(),
        virtualType:         jest.fn(),
        configureType:       jest.fn(),
        weightType:          jest.fn(),
        headers:             jest.fn(),
        hideBulkActions:     jest.fn(),

        mapGroup:    jest.fn(),
        ignoreGroup: jest.fn(),
        mapType:     jest.fn(),
        ignoreType:  jest.fn(),
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
        moveType:            jest.fn(),
        virtualType:         jest.fn(),
        configureType:       jest.fn(),
        weightType:          jest.fn(),
        headers:             jest.fn(),
        hideBulkActions:     jest.fn(),

        mapGroup:    jest.fn(),
        ignoreGroup: jest.fn(),
        mapType:     jest.fn(),
        ignoreType:  jest.fn(),
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
        moveType:            jest.fn(),
        virtualType:         jest.fn(),
        configureType:       jest.fn(),
        weightType:          jest.fn(),
        headers:             jest.fn(),
        hideBulkActions:     jest.fn(),
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

  describe('addProduct duplicate guard', () => {
    it('should throw when addProduct is called twice with the same product name (object form)', () => {
      const plugin = new Plugin('test-extension');

      const product: ProductMetadata = {
        name:  'my-product',
        label: 'My Product',
      };

      const config: ProductChildPage[] = [
        {
          name: 'page-a', label: 'Page A', component: { name: 'PageA' }
        },
      ];

      plugin.addProduct(product, config);

      expect(() => {
        plugin.addProduct(product, [{
          name: 'page-b', label: 'Page B', component: { name: 'PageB' }
        }]);
      }).toThrow('addProduct can only be called once per product');
    });

    it('should throw when addProduct is called twice with the same product name (string form)', () => {
      const plugin = new Plugin('test-extension');

      plugin.addProduct('my-product');

      expect(() => {
        plugin.addProduct('my-product');
      }).toThrow('addProduct can only be called once per product');
    });

    it('should throw when addProduct is called twice mixing string and object form for the same name', () => {
      const plugin = new Plugin('test-extension');

      plugin.addProduct('my-product');

      expect(() => {
        plugin.addProduct({ name: 'my-product', label: 'My Product' }, []);
      }).toThrow('addProduct can only be called once per product');
    });

    it('should allow addProduct for different product names', () => {
      const plugin = new Plugin('test-extension');

      plugin.addProduct('product-a');

      expect(() => {
        plugin.addProduct('product-b');
      }).not.toThrow();

      expect(plugin.productConfigs).toHaveLength(2);
    });

    it('should allow addProduct and extendProduct for the same name (extending is separate)', () => {
      const plugin = new Plugin('test-extension');

      plugin.addProduct('my-product');

      expect(() => {
        plugin.extendProduct('explorer', [{
          name: 'extra-page', label: 'Extra', component: { name: 'Extra' }
        }]);
      }).not.toThrow();

      expect(plugin.productConfigs).toHaveLength(2);
    });

    it('should throw when addProduct is called twice with single page product form', () => {
      const plugin = new Plugin('test-extension');

      const singlePage: ProductMetadataSinglePage = {
        name:      'my-dashboard',
        label:     'My Dashboard',
        component: { name: 'DashboardPage' },
      };

      plugin.addProduct(singlePage);

      expect(() => {
        plugin.addProduct(singlePage);
      }).toThrow('addProduct can only be called once per product');
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
          sideMenu: {
            children: 'not-an-array', // Invalid
            weight:   1,
          },

        },
      ];

      expect(() => {
        new PluginProduct(mockPlugin, productMetadata, badConfig);
      }).toThrow('forEach');
    });
  });
});
