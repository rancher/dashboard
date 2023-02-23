import { Popup, popupWindowOptions } from '@shell/utils/window';
import { parse as parseUrl, addParam } from '@shell/utils/url';
import { BACK_TO, SPA, _EDIT, _FLAGGED } from '@shell/config/query-params';
import { MANAGEMENT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

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

  return returnToUrl;
}

/**
 * Determines common auth provider info as those that are available (non-local) and the location of the enabled provider
 */
export const authProvidersInfo = async(store) => {
  const rows = await store.dispatch(`management/findAll`, { type: MANAGEMENT.AUTH_CONFIG });
  const nonLocal = rows.filter(x => x.name !== 'local');
  // Generic OIDC is returned via API but not supported (and will be removed or fixed in future)
  const supportedNonLocal = nonLocal.filter(x => x.id !== 'oidc');
  const enabled = nonLocal.filter(x => x.enabled === true );

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
};

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
      hash[key] = store.dispatch(`${ value.inStoreType }/findAll`, { type: value.type } );
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
