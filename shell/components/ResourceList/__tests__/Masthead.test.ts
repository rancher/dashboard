import { shallowMount } from '@vue/test-utils';
import Masthead from '@shell/components/ResourceList/Masthead.vue';

const PRODUCT_ID = 'sr';
const RESOURCE = 'sr.cattle.io.reviewbundle';
const ROUTE_NAME = 'c-cluster-product-resource';

const createStore = () => ({
  getters: {
    productId:                PRODUCT_ID,
    isExplorer:               false,
    currentCluster:           null,
    'type-map/hasCustomEdit': () => true,
    'type-map/labelFor':      () => 'Review Bundle',
    'type-map/optionsFor':    () => ({ isCreatable: true, canYaml: false }),
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
});
