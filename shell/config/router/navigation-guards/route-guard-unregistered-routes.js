export function install(router, context) {
  router.beforeEach(async(to, from, next) => {
    try {
      await handleRouteGuardUnregisteredRoutes(to, from, next, context);
    } catch (error) {
      console.error('Error in unregistered routes nav guard:', error); // eslint-disable-line no-console
      next();
    }
  });
}

/*
  Guard to handle unregistered routes for dynamic products/resources.
  If a route is not found for a given product/resource, redirect to 404.

  Especially useful for extensions.
*/
export async function handleRouteGuardUnregisteredRoutes(to, from, next, { store }) {
  const product = to.params?.product || to.meta?.product;
  const resource = to.params?.resource;

  if (product) {
    // get all types for the product
    const allTypes = store.getters['type-map/allTypes'](to.params?.product)?.all;

    if (allTypes) {
      let matchFound = false;

      // check if resource matches any registered type via key
      if (resource && allTypes[resource]) {
        matchFound = true;
      } else {
        // fallback: check if route name matches any registered type route name
        matchFound = Object.entries(allTypes).find(([key, value]) => value.route?.name === to.name);
      }

      if (!matchFound) {
        return next({ name: '404' });
      }
    }
  }

  // Always call next() if not redirected
  return next();
}
