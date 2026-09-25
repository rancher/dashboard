/**
 * Compatibility helper for reading top-level product routing flags off an extension's
 * `Plugin` instance.
 *
 * Extensions bundle their own copy of shell (only jquery/jszip/js-yaml are externalised),
 * but the `Plugin` instance itself is always created by the *host* Rancher, in
 * `extension-manager-impl.js`. A bundled reader can therefore be a different shell version
 * than the object it reads, and the flag shape changed between releases:
 *
 * - Rancher 2.15, the first release with V2 product registration, exposed a plugin-wide
 *   `topLevelProduct` boolean. Every top-level product was unconditionally product-prefixed.
 * - Rancher 2.16+ tracks `topLevelProducts` and `startRouteWithProductByProduct` per product,
 *   so one plugin can register several products that route differently.
 *
 * Before 2.15 neither flag exists, which correctly resolves to `false`.
 */

/** Minimal shape read here - covers both the 2.15 and the 2.16+ `Plugin` layouts. */
interface TopLevelProductFlags {
  /** 2.16+ - names of the products this plugin registered as top-level. */
  topLevelProducts?: Set<string>;
  /** 2.16+ - whether each product's routes are prefixed with the product name. */
  startRouteWithProductByProduct?: Record<string, boolean>;
  /** @deprecated 2.15 only - plugin-wide flag, superseded by `topLevelProducts`. */
  topLevelProduct?: boolean;
}

/**
 * Is `productId` registered by `plugin` as a top-level product whose routes are prefixed
 * with the product name (`<product>/c/:cluster/...` rather than `c/:cluster/<product>/...`)?
 */
export function isProductPrefixedTopLevel(plugin?: TopLevelProductFlags, productId?: string): boolean {
  if (!plugin || !productId) {
    return false;
  }

  // 2.16+ host. Checked first, and an empty Set is still this branch - a plugin that
  // registered no top-level product must not fall through to the boolean below.
  if (plugin.topLevelProducts) {
    return Boolean(plugin.topLevelProducts.has(productId) && plugin.startRouteWithProductByProduct?.[productId]);
  }

  // 2.15 host. That release had no `startRouteWithProduct` opt-out and always generated
  // product-prefixed routes, so the plugin-wide boolean is the complete answer there.
  return Boolean(plugin.topLevelProduct);
}
