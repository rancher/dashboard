import { INSTALL_REDIRECT_META_KEY } from '@shell/config/router/navigation-guards/install-redirect';

export function queryParamsFor(current, qp, defaults = {}) {
  const query = Object.assign({}, current || {});

  for ( const key of Object.keys(qp) ) {
    const val = qp[key];

    if ( typeof defaults[key] === 'undefined' ) {
      // There is no default
      query[key] = qp[key];
    } else if ( defaults[key] === false ) {
      // Value-less boolean flags
      if ( val ) {
        query[key] = null;
      } else {
        delete query[key];
      }
    } else if ( val === defaults[key] ) {
      // The value is the default
      delete query[key];
    } else {
      // The value is not the default
      query[key] = val;
    }
  }

  return query;
}

export function getClusterFromRoute(to) {
  let cluster = to.params?.cluster;

  if (!cluster) {
    cluster = findMeta(to, 'cluster');
  }

  return cluster;
}

export function getProductFromRoute(to) {
  let product = to.params?.product;

  if ( !product ) {
    const match = to.name?.match(/^c-cluster-([^-]+)/);

    if ( match ) {
      product = match[1];
    }
  }

  // If still no product, see if the route indicates the product via route metadata
  if (!product) {
    product = findMeta(to, 'product');
  }

  return product;
}

export const getPackageFromRoute = (route) => {
  if (!route?.meta) {
    return;
  }
  // Sometimes meta is an array... sometimes not
  const arraySafe = Array.isArray(route.meta) ? route.meta : [route.meta];

  return arraySafe.find((m) => !!m.pkg)?.pkg;
};

export const getResourceFromRoute = (to) => {
  let resource = to.params?.resource;

  if (!resource) {
    resource = findMeta(to, 'resource');
  }

  return resource;
};

/**
 * Some pages have no side nav entry of their own. For example, creating a
 * Project uses the generic `management.cattle.io.project` route, while the
 * associated list route is 'projectsnamespaces'. Nav entries can use
 * `navResources` to claim disparate routes and keep nav entries highlighted
 * while they are active.
 *
 * @param {*} navItem a side nav entry, as built by the type-map `getTree` getter
 * @param {*} to a VueRouter Route object
 * @returns true if the nav item claims the route's resource, false otherwise
 */
export const navItemClaimsRoute = (navItem, to) => {
  const resource = to ? getResourceFromRoute(to) : undefined;

  return !!resource && !!navItem?.navResources?.includes(resource);
};

/**
 * Whether a side nav entry should be highlighted for the given route. Both the
 * nav item and the group containing it use this to determine what is active.
 *
 * An item is active when any of these hold true:
 * - it claims the route's resource via `navResources`
 * - the route names the nav path it belongs to via `meta.nav`
 * - its own path matches the route. Unless the item is `exact`, pages nested
 *   under that path count too, so `/c/_/manager/kontainerDriver` stays active
 *   on `/c/_/manager/kontainerDriver/create`
 *
 * @param {*} router VueRouter instance
 * @param {*} to a VueRouter Route object
 * @param {*} navItem a side nav entry, as built by the type-map `getTree` getter
 * @returns true if the nav item should be highlighted, false otherwise
 */
export const isNavItemActive = (router, to, navItem) => {
  if (!navItem?.route) {
    return false;
  }

  if (navItemClaimsRoute(navItem, to)) {
    return true;
  }

  // Use .path instead of .fullPath to ignore query parameters and hashes when comparing routes
  const itemPath = router.resolve(filterLocationValidParams(router, navItem.route))?.path?.toLowerCase();
  const routePath = to?.path?.toLowerCase();

  if (!itemPath || !routePath) {
    return false;
  }

  // If the route explicitly declares the nav path that should be highlighted, then use that
  const routeMetaNav = findMeta(to, 'nav');

  if (routeMetaNav) {
    const navPath = Object.entries(to.params || {})
      .reduce((path, [param, value]) => path.replace(`:${ param }`, value), routeMetaNav)
      .toLowerCase();

    if (navPath === itemPath) {
      return true;
    }
  }

  if (navItem.exact) {
    return itemPath === routePath;
  }

  // Compare whole path segments, so `/foo/bar` is not treated as a parent of `/foo/barbaz`
  const itemSegments = itemPath.split('/');
  const routeSegments = routePath.split('/');

  return itemSegments.every((segment, index) => segment === routeSegments[index]);
};

/**
 * Given a route it will look through the matching parent routes to see if any match the fn (predicate) criteria
 *
 * @param {*} to a VueRouter Route object
 * @param {*} fn fn is a predicate which is passed a matched route. It will return true to indicate there was a matching route and false otherwise
 * @returns true if a matching route was found, false otherwise
 */
export const routeMatched = (to, fn) => {
  const matched = to?.matched || [];

  return !!matched.find(fn);
};

/**
 * Checks to see if the route requires authentication by taking a look at the route and it's parents 'meta' to see if it
 * contains { requiresAuthentication: true }
 * @param {*} to a VueRouter Route object
 * @returns true if the route requires authentication, false otherwise
 */
export const routeRequiresAuthentication = (to) => {
  return routeMatched(to, (matched) => matched.meta?.requiresAuthentication);
};

export const routeRequiresInstallRedirect = (to) => {
  return routeMatched(to, (matched) => matched.meta?.[INSTALL_REDIRECT_META_KEY]);
};

export function findMeta(route, key) {
  if (route?.meta) {
    const meta = Array.isArray(route.meta) ? route.meta : [route.meta];

    for (let i = 0; i < meta.length; i++) {
      if (meta[i][key]) {
        return meta[i][key];
      }
    }
  }

  return undefined;
}

/**
 * Find a route definition given a routeName
 * @param {*} router VueRouter instance
 * @param {*} routeName the name we want to look up
 * @returns the route definition or undefined if it wasn't found
 */
export function findRouteDefinitionByName(router, routeName) {
  const routes = router.getRoutes();

  return routes.find((r) => r.name === routeName);
}

/**
 * Looks for the route definition and then ensures there's only valid params
 * @param {*} router VueRouter instance
 * @param {*} routeRecord an object conforming to the Route Record interface
 * @returns the passed in routeLocation with only valid params.
 */
export function filterLocationValidParams(router, routeRecord) {
  if (!routeRecord || !routeRecord.name || !routeRecord.params) {
    console.warn('filterLocationValidParams received invalid arguments'); // eslint-disable-line no-console

    return routeRecord;
  }

  const routeDefinition = findRouteDefinitionByName(router, routeRecord.name);

  if (!routeDefinition) {
    console.warn('Could not find a route definition given the routeRecord', routeRecord); // eslint-disable-line no-console

    return routeRecord;
  }

  const specifiedParams = routeRecord.params;
  const validParams = {};

  Object.entries(specifiedParams).forEach(([key, value]) => {
    const pathParam = `:${ key }`;

    if (routeDefinition.path.includes(pathParam)) {
      validParams[key] = value;
    }
  });

  return {
    ...routeRecord,
    params: validParams
  };
}
