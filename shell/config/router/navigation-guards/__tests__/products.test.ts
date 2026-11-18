import { loadProducts } from '@shell/config/router/navigation-guards/products';
import { applyProducts } from '@shell/store/type-map';
import { setProduct } from '@shell/utils/product';

jest.mock('@shell/store/type-map', () => ({ applyProducts: jest.fn() }));
jest.mock('@shell/utils/product', () => ({ setProduct: jest.fn() }));

const TO = { name: 'my-product-c-cluster-resource', fullPath: '/my-product/c/local/some-resource' };

/** A store whose extension manager adds routes late `lateRoutes` times while the products are applied */
function makeStore(lateRoutes = 0) {
  const extension = { lateRoutesAdded: 0 };

  (applyProducts as jest.Mock).mockImplementation(() => {
    extension.lateRoutesAdded += lateRoutes;
  });

  return { dispatch: jest.fn(), $extension: extension };
}

describe('navigation-guards/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when applying the products adds no routes', () => {
    it('continues the navigation', async() => {
      const next = jest.fn();

      await loadProducts(TO, {}, next, { store: makeStore() });

      expect(next).toHaveBeenCalledWith();
    });

    it('sets the product', async() => {
      const store = makeStore();

      await loadProducts(TO, {}, jest.fn(), { store });

      expect(setProduct).toHaveBeenCalledWith(store, TO);
    });
  });

  describe('when applying the products adds routes', () => {
    it('navigates to the same path again so it can match the new routes', async() => {
      const next = jest.fn();

      await loadProducts(TO, {}, next, { store: makeStore(1) });

      expect(next).toHaveBeenCalledWith(TO.fullPath);
    });

    it('does not set the product', async() => {
      await loadProducts(TO, {}, jest.fn(), { store: makeStore(1) });

      expect(setProduct).not.toHaveBeenCalled();
    });
  });

  it('continues the navigation when there is no extension manager', async() => {
    const next = jest.fn();

    await loadProducts(TO, {}, next, { store: { dispatch: jest.fn() } });

    expect(next).toHaveBeenCalledWith();
  });
});
