import { Popup, popupWindowOptions } from '@shell/utils/window';
import { parse as parseUrl, addParam } from '@shell/utils/url';
import {
  BACK_TO, SPA, _EDIT, _FLAGGED, TIMED_OUT, IS_SLO, LOGGED_OUT
} from '@shell/config/query-params';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { getProductFromRoute, getResourceFromRoute } from '@shell/utils/router';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { findBy } from '@shell/utils/array';

export function openAuthPopup(url, provider) {
  const popup = new Popup(() => {
    popup.promise = new Promise((resolve, reject) => {
      popup.resolve = resolve;
      popup.reject = reject;
    });

    window.onAuthTest = (error, code) => {
      if (error) {
        popup.reject(error);
      }

      delete window.onAuthTest;
      popup.resolve(code);
    };
  }, () => {
    popup.reject(new Error('Access was not authorized'));
  });

  popup.open(url, 'auth-test', popupWindowOptions());

  return popup.promise;
}

export function returnTo(opt, vm) {
  let { route = `/auth/verify` } = opt;

  if ( vm.$router.options && vm.$router.options.base ) {
    const routerBase = vm.$router.options.base;

    if ( routerBase !== '/' ) {
      route = `${ routerBase.replace(/\/+$/, '') }/${ route.replace(/^\/+/, '') }`;
    }
  }

  let returnToUrl = `${ window.location.origin }${ route }`;

  const parsed = parseUrl(window.location.href);

  if ( parsed.query.spa !== undefined ) {
    returnToUrl = addParam(returnToUrl, SPA, _FLAGGED);
  }

  if ( opt.backTo ) {
    returnToUrl = addParam(returnToUrl, BACK_TO, opt.backTo);
  }

  if (opt.config) {
    returnToUrl = addParam(returnToUrl, 'config', opt.config);
  }

  if (opt.isSlo) {
    returnToUrl = addParam(returnToUrl, IS_SLO, _FLAGGED);
    returnToUrl = addParam(returnToUrl, LOGGED_OUT, _FLAGGED);
  }

  return returnToUrl;
}

/**
 * Determines common auth provider info as those that are available (non-local) and the location of the enabled provider
 */
export const authProvidersInfo = async(store) => {
  try {
    const rows = await store.dispatch(`management/findAll`, { type: MANAGEMENT.AUTH_CONFIG });

    return parseAuthProvidersInfo(rows);
  } catch (error) {
    return {};
  }
};

/**
 * Parses auth provider's info to return if there's an auth provider enabled
 */
export function parseAuthProvidersInfo(rows) {
  const nonLocal = rows.filter((x) => x.name !== 'local');
  const enabled = nonLocal.filter((x) => x.enabled === true );

  const supportedNonLocal = nonLocal.filter((x) => x.id !== 'oidc');

  const enabledLocation = enabled.length === 1 ? {
    name:   'c-cluster-auth-config-id',
    params: { id: enabled[0].id },
    query:  { mode: _EDIT }
  } : null;

  return {
    nonLocal: supportedNonLocal,
    enabledLocation,
    enabled
  };
}

export const checkSchemasForFindAllHash = (types, store) => {
  const hash = {};

  for (const [key, value] of Object.entries(types)) {
    const schema = store.getters[`${ value.inStoreType }/schemaFor`](value.type);

    // It could be that user has permissions for GET but not list
    // e.g. Standard user with GitRepo permissions try to fetch list of fleetworkspaces
    // user has ability to GET but not fleet workspaces
    // so optionally define a function that require it to pass before /findAll
    const validSchema = value.schemaValidator ? value.schemaValidator(schema) : !!schema;

    if (validSchema) {
      const res = store.dispatch(`${ value.inStoreType }/findAll`, { type: value.type, opt: value.opt } );

      if (!value.skipWait) {
        hash[key] = res;
      }
    }
  }

  return allHash(hash);
};

export const checkPermissions = (types, getters) => {
  const hash = {};

  for (const [key, value] of Object.entries(types)) {
    const schema = getters['management/schemaFor'](value.type);

    if (!schema) {
      hash[key] = false;

      continue;
    }

    // It could be that user has permissions for GET but not list
    // e.g. Standard user with GitRepo permissions try to fetch list of fleetworkspaces
    // user has ability to GET but not fleet workspaces
    // so optionally define a function that require it to pass before /findAll
    if (value.schemaValidator) {
      hash[key] = value.schemaValidator(schema);

      continue;
    }

    if (value.resourceMethods && schema) {
      hash[key] = value.resourceMethods.every((method) => {
        return (schema.resourceMethods || []).includes(method);
      });

      continue;
    }

    if (value.collectionMethods && schema) {
      hash[key] = value.collectionMethods.every((method) => {
        return (schema.collectionMethods || []).includes(method);
      });

      continue;
    }

    hash[key] = !!schema;
  }

  return allHash(hash);
};

export const canViewResource = (store, resource) => {
  // Note - don't use the current products store... because products can override stores for resources with `typeStoreMap`
  const inStore = store.getters['currentStore'](resource);
  // There's a chance we're in an extension's product who's store could be anything, so confirm schemaFor exists
  const schemaFor = store.getters[`${ inStore }/schemaFor`];

  // In order to check a resource is valid we need these
  if (!inStore || !schemaFor) {
    return false;
  }

  // Resource is valid if a schema exists for it (standard resource, spoofed resource) or it's a virtual resource
  const validResource = schemaFor(resource) || store.getters['type-map/isVirtual'](resource);

  return !!validResource;
};

// ************************************************************
//
// BELOW ARE METHODS THAT ARE A PART OF THE AUTHENTICATED MIDDLEWARE REMOVAL. THIS IS A TEMPORARY HOME FOR THESE UTILS AND SHOULD BE REWRITTEN, MOVED OR DELETED.
//
// TODO: Remove and refactor everything below for more clarity and better organization. https://github.com/rancher/dashboard/issues/11111
//
// ************************************************************

/**
 * Attempt to set the product in our datastore if the route matches a known product. Otherwise show an error page instead.
 */
export function setProduct(store, to) {
  let product = getProductFromRoute(to);

  // since all products are hardcoded as routes (ex: c-local-explorer), if we match the wildcard route it means that the product does not exist
  if ((product && (!to.matched.length || (to.matched.length && to.matched[0].path === '/c/:cluster/:product'))) ||
  // if the product grabbed from the route is not registered, then we don't have it!
  (product && !store.getters['type-map/isProductRegistered'](product))) {
    const error = new Error(store.getters['i18n/t']('nav.failWhale.productNotFound', { productNotFound: product }, true));

    return store.dispatch('loadingError', error);
  }

  if ( !product ) {
    product = EXPLORER;
  }

  const oldProduct = store.getters['productId'];
  const oldStore = store.getters['currentProduct']?.inStore;

  if ( product !== oldProduct ) {
    store.commit('setProduct', product);
  }

  const neuStore = store.getters['currentProduct']?.inStore;

  if ( neuStore !== oldStore ) {
    // If the product store changes, clear the catalog.
    // There might be management catalog items in it vs cluster.
    store.commit('catalog/reset');
  }
}

/**
 * Check that the resource is valid, if not redirect to fail whale
 *
 * This requires that
 * - product is set
 * - product's store is set and setup (so we can check schema's within it)
 * - product's store has the schemaFor getter (extension stores might not have it)
 * - there's a resource associated with route (meta or param)
 */
export function validateResource(store, to) {
  const product = store.getters['currentProduct'];
  const resource = getResourceFromRoute(to);

  // In order to check a resource is valid we need these
  if (!product || !resource) {
    return false;
  }

  if (canViewResource(store, resource)) {
    return false;
  }

  // Unknown resource, redirect to fail whale

  const error = new Error(store.getters['i18n/t']('nav.failWhale.resourceNotFound', { resource }, true));

  store.dispatch('loadingError', error);

  throw error;
}

/**
 * Attempt to load the current user's principal
 */
export async function findMe(store) {
  // First thing we do in loadManagement is fetch principals anyway.... so don't ?me=true here
  const principals = await store.dispatch('rancher/findAll', {
    type: NORMAN.PRINCIPAL,
    opt:  {
      url:                  '/v3/principals',
      redirectUnauthorized: false,
    }
  });

  const me = findBy(principals, 'me', true);

  return me;
}

/**
 * Attempt to login with default credentials. Note: I think that this may actually be outdated since we don't use these default credentials anymore on setup.
 */
export async function tryInitialSetup(store, password = 'admin') {
  try {
    const res = await store.dispatch('auth/login', {
      provider: 'local',
      body:     {
        username: 'admin',
        password
      },
    });

    return res._status === 200;
  } catch (e) {
    console.error('Error trying initial setup', e); // eslint-disable-line no-console

    return false;
  }
}

/**
 * Record in our state management that we're indeed logged in
 */
export function isLoggedIn(store, me) {
  store.commit('auth/hasAuth', true);
  store.commit('auth/loggedInAs', me.id);
}

/**
 * Record in our state management that we're not logged in and then redirect to the login page
 */
export function notLoggedIn(store, redirect, route) {
  store.commit('auth/hasAuth', true);

  if (!route.name.includes('auth')) {
    store.commit('prefs/setAuthRedirect', route);
  }

  if ( route.name === 'index' ) {
    return redirect('/auth/login');
  } else {
    return redirect(`/auth/login?${ TIMED_OUT }`);
  }
}

/**
 * Record in our state management that we don't have any auth providers
 */
export function noAuth(store) {
  store.commit('auth/hasAuth', false);
}
