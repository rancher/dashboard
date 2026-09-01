import { setProduct } from '@shell/utils/product';
import { getProductFromRoute } from '@shell/utils/router';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { RouteLocation } from 'vue-router';

// Mock dependencies
jest.mock('@shell/utils/router', () => ({ getProductFromRoute: jest.fn() }));

const mockGetProductFromRoute = getProductFromRoute as jest.Mock;

describe('utils/product', () => {
  describe('setProduct', () => {
    let mockStore: any;
    let mockTo: RouteLocation;

    beforeEach(() => {
      jest.clearAllMocks();

      // A stateful mock store to better simulate Vuex behavior
      mockStore = {
        productId: 'some-old-product',
        products:  {
          'some-old-product':       { name: 'some-old-product', inStore: 'store_a' },
          'new-product-same-store': { name: 'new-product-same-store', inStore: 'store_a' },
          'new-product-diff-store': { name: 'new-product-diff-store', inStore: 'store_b' },
          [EXPLORER]:               { name: EXPLORER, inStore: 'explorer_store' },
        },
        getters: {
          'type-map/isProductRegistered': jest.fn().mockReturnValue(true),
          'i18n/t':                       jest.fn((key, args) => `${ key } ${ JSON.stringify(args) || '' }`),
          get currentProduct() {
            return mockStore.products[mockStore.productId];
          },
          get productId() {
            return mockStore.productId;
          }
        },
        commit: jest.fn((type, payload) => {
          if (type === 'setProduct') {
            mockStore.productId = payload;
          }
        }),
        dispatch: jest.fn(),
      };

      mockTo = { matched: [{ path: '/c/:cluster/some-product' }] } as unknown as RouteLocation;
    });

    it('should dispatch loadingError if product is not found (wildcard route)', () => {
      const product = 'invalid-product';

      mockGetProductFromRoute.mockReturnValue(product);
      mockTo.matched = [{ path: '/c/:cluster/:product' }] as any;

      setProduct(mockStore, mockTo);

      expect(mockStore.dispatch).toHaveBeenCalledWith('loadingError', expect.any(Error));
      expect(mockStore.getters['i18n/t']).toHaveBeenCalledWith('nav.failWhale.productNotFound', { productNotFound: product }, true);
      expect(mockStore.commit).not.toHaveBeenCalled();
    });

    it('should dispatch loadingError if product exists but route has no matches', () => {
      const product = 'invalid-product';

      mockGetProductFromRoute.mockReturnValue(product);
      mockTo.matched = [] as any; // No matched routes

      setProduct(mockStore, mockTo);

      expect(mockStore.dispatch).toHaveBeenCalledWith('loadingError', expect.any(Error));
      expect(mockStore.getters['i18n/t']).toHaveBeenCalledWith('nav.failWhale.productNotFound', { productNotFound: product }, true);
      expect(mockStore.commit).not.toHaveBeenCalled();
    });

    it('should dispatch loadingError if product is not registered', () => {
      const product = 'unregistered-product';

      mockGetProductFromRoute.mockReturnValue(product);
      mockStore.getters['type-map/isProductRegistered'].mockReturnValue(false);

      setProduct(mockStore, mockTo);

      expect(mockStore.dispatch).toHaveBeenCalledWith('loadingError', expect.any(Error));
      expect(mockStore.getters['i18n/t']).toHaveBeenCalledWith('nav.failWhale.productNotFound', { productNotFound: product }, true);
      expect(mockStore.commit).not.toHaveBeenCalled();
    });

    it('should default to EXPLORER product and reset catalog if store changes', () => {
      mockGetProductFromRoute.mockReturnValue(null);

      setProduct(mockStore, mockTo);

      expect(mockStore.commit).toHaveBeenCalledWith('setProduct', EXPLORER);
      expect(mockStore.commit).toHaveBeenCalledWith('catalog/reset');
    });

    it('should not call any commits if the product has not changed', () => {
      const product = 'some-old-product';

      mockGetProductFromRoute.mockReturnValue(product);

      setProduct(mockStore, mockTo);

      expect(mockStore.commit).not.toHaveBeenCalled();
    });

    it('should change product but not reset catalog if inStore is the same', () => {
      const newProduct = 'new-product-same-store';

      mockGetProductFromRoute.mockReturnValue(newProduct);

      setProduct(mockStore, mockTo);

      expect(mockStore.commit).toHaveBeenCalledWith('setProduct', newProduct);
      expect(mockStore.commit).not.toHaveBeenCalledWith('catalog/reset');
    });

    it('should change product and reset catalog if inStore is different', () => {
      const newProduct = 'new-product-diff-store';

      mockGetProductFromRoute.mockReturnValue(newProduct);

      setProduct(mockStore, mockTo);

      expect(mockStore.commit).toHaveBeenCalledWith('setProduct', newProduct);
      expect(mockStore.commit).toHaveBeenCalledWith('catalog/reset');
    });
  });
});
