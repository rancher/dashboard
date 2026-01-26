export function install(router, context) {
  router.beforeEach(async(to, from, next) => {
    await handleRouteGuardUnregisteredRoutes(to, from, next, context);
  });
}

/*
  Guard to handle unregistered routes for dynamic products/resources.
  If a route is not found for a given product/resource, redirect to 404.

  This guard enforces that:
  1. Schema-based resources must have their schema available in the store
  2. Virtual types must pass their ifHave/ifFeature/ifHaveType conditions

  This prevents users from accessing routes via direct URL navigation when:
  - The type doesn't exist
  - Extension routes have conditions that aren't met (e.g., feature flags, permissions)
*/
export async function handleRouteGuardUnregisteredRoutes(to, from, next, { store }) {
  const product = to.params?.product || to.meta?.product;
  const resource = to.params?.resource;

  if (!product) {
    return next();
  }

  // Get the store module for this product
  const productConfig = store.state['type-map']?.products?.find((p) => p.name === product);

  if (!productConfig) {
    return next();
  }

  // For routes with a resource parameter (standard resource routes like /c/_/product/resource)
  if (resource) {
    const inStore = productConfig.inStore || 'cluster';

    // Check if the schema exists in the appropriate store
    const schemas = store.getters[`${ inStore }/all`]?.('schema');

    if (!schemas || !Array.isArray(schemas)) {
      // Schemas not loaded yet, allow navigation to proceed
      return next();
    }

    const schemaExists = schemas.some((schema) => schema.id === resource);

    if (!schemaExists) {
      // No schema found - check if this is a virtual/spoofed type that meets its conditions
      // The allTypes getter already filters types based on ifHave/ifFeature/ifHaveType/etc
      // So if a type appears in allTypes, it means all its conditions are satisfied
      const allTypes = store.getters['type-map/allTypes'](product);
      const typeExistsInAnyMode = allTypes && Object.values(allTypes).some((modeTypes) => {
        return modeTypes && (modeTypes[resource] || Object.values(modeTypes).some((type) => type?.route?.name === to.name));
      });

      if (!typeExistsInAnyMode) {
        // Type doesn't exist OR its conditions aren't met - redirect to 404
        return next({ name: '404' });
      }
    }
  } else {
    // For custom routes without a resource parameter (e.g., extension routes like /c/_/settings/registration)
    // Check if this route name matches a virtual type that meets its conditions
    const allTypes = store.getters['type-map/allTypes'](product);
    const routeIsRegistered = allTypes && Object.values(allTypes).some((modeTypes) => {
      return modeTypes && Object.values(modeTypes).some((type) => type?.route?.name === to.name);
    });

    if (!routeIsRegistered) {
      // Route doesn't match any registered virtual type OR its conditions aren't met
      return next({ name: '404' });
    }
  }

  // Schema exists OR virtual type exists and meets conditions - allow navigation
  return next();
}
