export function install(router, context) {
  router.beforeEach((to, from, next) => guardExtensionRoute(to, from, next, context));
}

/**
 * Guard that prevents direct URL access to extension routes whose virtualType conditions
 * (ifHave, ifFeature, ifHaveType, etc.) are not met.
 *
 * Only applies to routes registered via pluginRoutes.addRoutes(), which automatically
 * stamps meta._extensionRoute = true on every route it registers. Routes that do not
 * carry that flag are never touched by this guard.
 *
 * The guard relies on the allTypes getter, which already evaluates all virtualType
 * conditions — if a virtualType is absent from the allTypes result it means its
 * conditions failed, and the corresponding route should not be accessible.
 */
export function guardExtensionRoute(to, from, next, { store }) {
  // Only applies to routes registered through the extension system
  if (!to.meta?._extensionRoute) {
    return next();
  }

  // Timing-safe bail-out: if products haven't been registered yet (applyProducts
  // hasn't run), we can't evaluate conditions — allow and let the next navigation
  // re-apply the check with full data.
  const products = store.state['type-map']?.products;

  if (!products?.length) {
    return next();
  }

  // Find a virtualType whose route.name matches the navigated-to route name
  let matchingVirtualType = null;
  let owningProductName = null;

  for (const product of products) {
    const virtualTypes = store.state['type-map'].virtualTypes[product.name] || [];
    const match = virtualTypes.find((vt) => vt.route?.name === to.name);

    if (match) {
      matchingVirtualType = match;
      owningProductName = product.name;
      break;
    }
  }

  // No matching virtualType means this is a pure extension route with no gate — allow
  if (!matchingVirtualType) {
    return next();
  }

  // VirtualType is registered but has no conditions — allow
  const hasConditions = !!(
    matchingVirtualType.ifHave ||
    matchingVirtualType.ifFeature ||
    matchingVirtualType.ifHaveType ||
    matchingVirtualType.ifHaveSubTypes ||
    typeof matchingVirtualType.ifRancherCluster !== 'undefined'
  );

  if (!hasConditions) {
    return next();
  }

  // allTypes already evaluates every condition; if the virtualType is absent from
  // its output the conditions are not met and the route should not be accessible.
  const allTypes = store.getters['type-map/allTypes'](owningProductName);
  const conditionsPassed = Object.values(allTypes).some(
    (modeTypes) => modeTypes?.[matchingVirtualType.name]
  );

  return conditionsPassed ? next() : next({ name: '404' });
}
