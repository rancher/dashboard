import {
  registerExtensionProductRouting,
  markExtensionProductResourceRoutes,
  getExtensionProductRouting,
  forgetExtensionProductRouting,
  resetExtensionProductRouting,
} from '@shell/core/plugin-products-route-registry';

describe('extension product route registry', () => {
  beforeEach(() => resetExtensionProductRouting());

  describe('getExtensionProductRouting', () => {
    it('should return undefined for a product that was never registered', () => {
      expect(getExtensionProductRouting('explorer')).toBeUndefined();
    });

    it.each([
      ['product prefixed routes', true],
      ['cluster prefixed routes', false],
    ])('should return the routing recorded for a product with %s', (_label, startRouteWithProduct) => {
      registerExtensionProductRouting('my-product', startRouteWithProduct);

      expect(getExtensionProductRouting('my-product')).toStrictEqual({ startRouteWithProduct, hasResourceRoutes: false });
    });

    it('should not leak routing between products', () => {
      registerExtensionProductRouting('product-a', true);

      expect(getExtensionProductRouting('product-b')).toBeUndefined();
    });
  });

  describe('registerExtensionProductRouting', () => {
    it('should start a product off without the generic resource routes', () => {
      registerExtensionProductRouting('my-product', true);

      expect(getExtensionProductRouting('my-product')?.hasResourceRoutes).toBe(false);
    });

    it('should reset the resource routes flag when a product is re-registered', () => {
      registerExtensionProductRouting('my-product', true);
      markExtensionProductResourceRoutes('my-product');
      registerExtensionProductRouting('my-product', true);

      expect(getExtensionProductRouting('my-product')?.hasResourceRoutes).toBe(false);
    });
  });

  describe('markExtensionProductResourceRoutes', () => {
    it('should flag that the product now owns the generic resource routes', () => {
      registerExtensionProductRouting('my-product', true);
      markExtensionProductResourceRoutes('my-product');

      expect(getExtensionProductRouting('my-product')).toStrictEqual({ startRouteWithProduct: true, hasResourceRoutes: true });
    });

    it('should do nothing for a product that is not in the registry', () => {
      markExtensionProductResourceRoutes('explorer');

      expect(getExtensionProductRouting('explorer')).toBeUndefined();
    });
  });

  describe('forgetExtensionProductRouting', () => {
    it('should drop the product from the registry', () => {
      registerExtensionProductRouting('my-product', true);
      forgetExtensionProductRouting('my-product');

      expect(getExtensionProductRouting('my-product')).toBeUndefined();
    });

    it('should leave other products alone', () => {
      registerExtensionProductRouting('product-a', true);
      registerExtensionProductRouting('product-b', false);
      forgetExtensionProductRouting('product-a');

      expect(getExtensionProductRouting('product-b')).toStrictEqual({ startRouteWithProduct: false, hasResourceRoutes: false });
    });

    it('should not throw for a product that was never registered', () => {
      expect(() => forgetExtensionProductRouting('explorer')).not.toThrow();
    });
  });

  describe('resetExtensionProductRouting', () => {
    it('should empty the registry', () => {
      registerExtensionProductRouting('product-a', true);
      registerExtensionProductRouting('product-b', false);
      resetExtensionProductRouting();

      expect(getExtensionProductRouting('product-a')).toBeUndefined();
      expect(getExtensionProductRouting('product-b')).toBeUndefined();
    });
  });
});
