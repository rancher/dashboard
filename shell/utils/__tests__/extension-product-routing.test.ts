import { isProductPrefixedTopLevel } from '@shell/utils/extension-product-routing';

describe('fx: isProductPrefixedTopLevel', () => {
  describe('given a Rancher 2.16+ host, tracking flags per product', () => {
    // A single plugin registering a mix of products - the case the per-product
    // tracking exists to get right.
    const plugin = {
      topLevelProducts:               new Set(['my-product', 'legacy-product']),
      startRouteWithProductByProduct: {
        'my-product':     true,
        'legacy-product': false,
      },
    };

    const cases: [string, string, boolean][] = [
      ['a top-level product using product-prefixed routes', 'my-product', true],
      ['a top-level product that opted out of the prefix', 'legacy-product', false],
      ['a product the plugin extends rather than owns', 'fleet', false],
      ['a product the plugin knows nothing about', 'unknown-product', false],
    ];

    it.each(cases)('should resolve %s to %s', (_label, productId, expected) => {
      expect(isProductPrefixedTopLevel(plugin, productId)).toStrictEqual(expected);
    });

    it('should not fall back to the deprecated boolean when no top-level product is registered', () => {
      // An empty Set is truthy, so this must still take the per-product branch. If it
      // fell through, the stale boolean below would wrongly win.
      const emptyPlugin = {
        topLevelProducts:               new Set<string>(),
        startRouteWithProductByProduct: {},
        topLevelProduct:                true,
      };

      expect(isProductPrefixedTopLevel(emptyPlugin, 'my-product')).toStrictEqual(false);
    });

    it('should resolve to false when the product is top-level but has no routing entry', () => {
      const partialPlugin = {
        topLevelProducts:               new Set(['my-product']),
        startRouteWithProductByProduct: {},
      };

      expect(isProductPrefixedTopLevel(partialPlugin, 'my-product')).toStrictEqual(false);
    });
  });

  describe('given a Rancher 2.15 host, exposing only the plugin-wide boolean', () => {
    it('should treat any product of a top-level plugin as product-prefixed', () => {
      // 2.15 had no opt-out and always generated product-prefixed routes, so the
      // boolean is the complete answer for that host.
      expect(isProductPrefixedTopLevel({ topLevelProduct: true }, 'my-product')).toStrictEqual(true);
    });

    it('should resolve to false when the plugin registered no top-level product', () => {
      expect(isProductPrefixedTopLevel({ topLevelProduct: false }, 'my-product')).toStrictEqual(false);
    });
  });

  describe('given a pre-2.15 host, without V2 product registration', () => {
    it('should resolve to false when neither flag exists', () => {
      expect(isProductPrefixedTopLevel({}, 'my-product')).toStrictEqual(false);
    });
  });

  describe('given incomplete input', () => {
    it('should resolve to false without a plugin', () => {
      expect(isProductPrefixedTopLevel(undefined, 'my-product')).toStrictEqual(false);
    });

    it('should resolve to false without a product id', () => {
      expect(isProductPrefixedTopLevel({ topLevelProduct: true }, undefined)).toStrictEqual(false);
    });

    it('should resolve to false for an empty product id', () => {
      // `plugins['']` is how the callers spell "no matching plugin found".
      expect(isProductPrefixedTopLevel({ topLevelProduct: true }, '')).toStrictEqual(false);
    });
  });
});
