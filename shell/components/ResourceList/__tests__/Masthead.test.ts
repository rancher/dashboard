import { shallowMount } from '@vue/test-utils';
import Masthead from '@shell/components/ResourceList/Masthead.vue';

const PRODUCT_ID = 'sr';
const RESOURCE = 'sr.cattle.io.reviewbundle';
const ROUTE_NAME = 'c-cluster-product-resource';

const createStore = (getters: Record<string, any> = {}) => ({
  getters: {
    productId:                PRODUCT_ID,
    isExplorer:               false,
    currentCluster:           null,
    'type-map/hasCustomEdit': () => true,
    'type-map/labelFor':      () => 'Review Bundle',
    'type-map/optionsFor':    () => ({ isCreatable: true, canYaml: false }),
    ...getters,
  },
});

const createWrapper = (mocks: Record<string, any> = {}) => shallowMount(Masthead as any, {
  props:  { resource: RESOURCE, schema: { collectionMethods: ['post'] } },
  global: {
    mocks: {
      $store: createStore(),
      $route: {
        name:   ROUTE_NAME,
        params: {
          cluster: '_', product: PRODUCT_ID, resource: RESOURCE
        }
      },
      t: (key: string) => key,
      ...mocks,
    },
  },
});

describe('component: MastheadResourceList', () => {
  describe('given an extension manager exposed as $extension', () => {
    it('should override the create route for a V2 top level product', () => {
      const wrapper = createWrapper({ $extension: { getPlugins: () => ({ srPlugin: { productNames: [PRODUCT_ID], topLevelProduct: true } }) } });

      expect((wrapper.vm as any).overrideCreateLocationByExtension).toBe(true);
      expect((wrapper.vm as any).formRoute).toStrictEqual({
        name:   `${ ROUTE_NAME }-create`,
        params: {
          cluster: '_', product: PRODUCT_ID, resource: RESOURCE
        },
      });
    });

    it('should use the original create route when no plugin owns the current product', () => {
      const wrapper = createWrapper({ $extension: { getPlugins: () => ({ otherPlugin: { productNames: ['other'], topLevelProduct: true } }) } });

      expect((wrapper.vm as any).overrideCreateLocationByExtension).toBe(false);
    });
  });

  // https://github.com/rancher/dashboard/issues/18634 - on Rancher 2.11/2.12/2.13 the manager
  // lives on `$plugin`, and the compat shim that aliases the two cannot have run by the time
  // `data()` executes on the first render, so this component must not assume `$extension`.
  describe('given an extension manager that is not reachable via $extension', () => {
    it.each([
      ['$extension is undefined', { $extension: undefined }],
      ['$extension has no getPlugins yet', { $extension: {} }],
    ])('should render and fall back to the original create route when %s', (_label, mocks) => {
      const wrapper = createWrapper(mocks);

      expect(wrapper.find('header').exists()).toBe(true);
      expect((wrapper.vm as any).overrideCreateLocationByExtension).toBe(false);
      expect((wrapper.vm as any).formRoute).toStrictEqual({
        name:   `${ ROUTE_NAME }-create`,
        params: {
          cluster: '_', product: PRODUCT_ID, resource: RESOURCE
        },
      });
    });
  });

  // The 2.16+ `Plugin` layout tracks top level products per product rather than with a
  // single plugin-wide boolean. See @shell/utils/extension-product-routing.
  describe('given a 2.16+ host plugin layout', () => {
    it.each([
      ['the product is top level and product-prefixed', new Set([PRODUCT_ID]), { [PRODUCT_ID]: true }, true],
      ['the product is top level but opts out of the product prefix', new Set([PRODUCT_ID]), { [PRODUCT_ID]: false }, false],
      ['the plugin registered no top level product', new Set<string>(), {}, false],
    ])('should resolve the override to %s', (_label, topLevelProducts, startRouteWithProductByProduct, expected) => {
      const wrapper = createWrapper({
        $extension: {
          getPlugins: () => ({
            srPlugin: {
              productNames: [PRODUCT_ID], topLevelProducts, startRouteWithProductByProduct
            }
          })
        }
      });

      expect((wrapper.vm as any).overrideCreateLocationByExtension).toBe(expected);
    });
  });

  describe('the derived routes', () => {
    it('should build the yaml create route from the current route', () => {
      const wrapper = createWrapper();

      expect((wrapper.vm as any).yamlRoute).toStrictEqual({
        name:   `${ ROUTE_NAME }-create`,
        params: {
          cluster: '_', product: PRODUCT_ID, resource: RESOURCE
        },
        query: { as: 'yaml' },
      });
    });

    it('should not share the params object between the form and yaml routes', () => {
      const wrapper = createWrapper();

      expect((wrapper.vm as any).formRoute.params).not.toBe((wrapper.vm as any).yamlRoute.params);
    });

    it('should read hasEditComponent from the type map for the resource', () => {
      const hasCustomEdit = jest.fn().mockReturnValue(false);
      const wrapper = createWrapper({ $store: createStore({ 'type-map/hasCustomEdit': hasCustomEdit }) });

      expect((wrapper.vm as any).hasEditComponent).toBe(false);
      expect(hasCustomEdit).toHaveBeenCalledWith(RESOURCE);
    });

    // Derivation used to happen in data(), so the extension manager was read on every
    // Masthead regardless of whether the create button rendered. As a computed it is only
    // reached through _createLocation, which the button's v-if gates.
    it('should not read the extension manager when there is no custom edit component', () => {
      const getPlugins = jest.fn().mockReturnValue({});

      createWrapper({
        $store:     createStore({ 'type-map/hasCustomEdit': () => false }),
        $extension: { getPlugins },
      });

      expect(getPlugins).toHaveBeenCalledTimes(0);
    });
  });
});
