/**
 * What routes does each extension registered product own?
 *
 * Extending a product has to generate routes that match how the product being extended already
 * routes, and it has to know whether that product already owns the generic `:resource` routes:
 *
 * - Core products are already covered by the core `c/:cluster/:product/:resource` routes in
 *   `shell/config/router/routes.js`, and they also have specific routes of their own (e.g.
 *   explorer's `projectsnamespaces`). Minting `c/:cluster/<product>/:resource` for them
 *   re-introduces rancher/dashboard#18749: the static product segment outranks the core dynamic
 *   `:product` one, so it shadows those specific routes.
 * - Extension products route as `<product>/c/:cluster/...`, or as `c/:cluster/<product>/...` when
 *   registered with `startRouteWithProduct: false`. They have no specific routes to shadow - their
 *   custom pages are static paths, which outrank `:resource` - so they get their own generic
 *   `:resource` routes in either shape. They only own them if they registered at least one
 *   resource page themselves, so extending one with its first resource page has to add them.
 *
 * Not in the registry means "core product" - the core routes cover it.
 *
 * This is module level rather than per `Plugin` because an extension can extend a product that a
 * *different* extension registered, and every extension gets its own `Plugin` instance. The
 * `Plugin` objects are always created by the host (`extension-manager-impl.js`), so every
 * extension goes through this one copy of the module.
 *
 * @internal
 */

export interface ExtensionProductRouting {
  /** Pages route as `<product>/c/:cluster/...` rather than `c/:cluster/<product>/...` */
  startRouteWithProduct: boolean;
  /** The product already owns the generic `:resource` list/create/detail routes */
  hasResourceRoutes: boolean;
}

const registry: Map<string, ExtensionProductRouting> = new Map();

/**
 * Record a product an extension registered as a top level product. Called before its routes are
 * generated, so it starts out without the generic resource routes.
 */
export function registerExtensionProductRouting(productName: string, startRouteWithProduct: boolean): void {
  registry.set(productName, { startRouteWithProduct, hasResourceRoutes: false });
}

/**
 * Flag that the generic `:resource` routes now exist for this product, so a later registration
 * extending it does not add them a second time.
 */
export function markExtensionProductResourceRoutes(productName: string): void {
  const existing = registry.get(productName);

  if (existing) {
    existing.hasResourceRoutes = true;
  }
}

/**
 * How does `productName` route? `undefined` for core products, which the core
 * `c/:cluster/:product/...` routes already cover.
 */
export function getExtensionProductRouting(productName: string): ExtensionProductRouting | undefined {
  return registry.get(productName);
}

/**
 * Drop a product from the registry. Only for products an extension *owns* - not ones it merely
 * extends - otherwise uninstalling the extending extension would forget the owner's routing.
 */
export function forgetExtensionProductRouting(productName: string): void {
  registry.delete(productName);
}

/**
 * @internal Test only - the registry outlives any single `Plugin`, so tests have to clear it.
 */
export function resetExtensionProductRouting(): void {
  registry.clear();
}
