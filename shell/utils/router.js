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
