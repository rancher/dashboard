jest.mock('@shell/utils/dynamic-importer', () => ({
  listProducts: () => ['alpha', 'omega'],
  loadProduct:  jest.fn(),
}));

describe('fx: applyProducts', () => {
  let applyProducts: (store: any, ext: any) => Promise<void>;
  let productsLoaded: () => boolean;
  let loadProduct: jest.Mock;
  let registered: string[];
  const extension = { loadProducts: jest.fn() };

  beforeEach(() => {
    // `applyProducts` remembers the load in module scope, so each case needs a
    // fresh copy of the module to start from nothing registered.
    jest.resetModules();
    ({ applyProducts, productsLoaded } = require('@shell/store/type-map'));
    ({ loadProduct } = require('@shell/utils/dynamic-importer'));
    registered = [];
    extension.loadProducts.mockClear();
  });

  const registers = () => loadProduct.mockImplementation(
    (name: string) => Promise.resolve({ init: () => registered.push(name) })
  );

  it('should register every product once', async() => {
    registers();

    await applyProducts({}, extension);

    expect(registered).toStrictEqual(['alpha', 'omega']);
    expect(extension.loadProducts).toHaveBeenCalledWith();
    expect(productsLoaded()).toBe(true);
  });

  it('should make a caller that arrives mid-load wait for it', async() => {
    let release = () => undefined as void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    loadProduct.mockImplementation(async(name: string) => {
      if (name === 'alpha') {
        await gate;
      }

      return { init: () => registered.push(name) };
    });

    const first = applyProducts({}, extension);
    // A second navigation, arriving while the first load is still in flight
    const second = applyProducts({}, extension);

    setTimeout(release, 10);
    await second;

    // Returning early here is what let a route render against a half-registered
    // product list, which is where `currentProduct` starts answering for the
    // wrong product
    expect(registered).toStrictEqual(['alpha', 'omega']);
    await first;
  });

  it('should let a later caller retry after a failed load', async() => {
    loadProduct.mockRejectedValueOnce(new Error('chunk failed'));

    await expect(applyProducts({}, extension)).rejects.toThrow('chunk failed');

    registers();
    await applyProducts({}, extension);

    expect(registered).toStrictEqual(['alpha', 'omega']);
  });

  it('should not require an extension manager to register the built-in products', async() => {
    registers();

    await applyProducts({}, undefined);

    expect(registered).toStrictEqual(['alpha', 'omega']);
  });
});
