import { PluginProduct } from '@shell/core/plugin-products';
import { IExtension } from '@shell/core/types';
import { ProductChildPage, StandardProductNames } from '@shell/core/plugin-products-external';

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
});
