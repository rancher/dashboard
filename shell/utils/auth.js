import { Popup, popupWindowOptions } from '@shell/utils/window';
import { parse as parseUrl, addParam } from '@shell/utils/url';
import { BACK_TO, SPA, _EDIT, _FLAGGED } from '@shell/config/query-params';
import { MANAGEMENT } from '@shell/config/types';
import { allHashSettled } from '~/shell/utils/promise';

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

export const checkSchemasForFindAllHash = async (types, store) => {
  const hash = {};

  for (const [key, value] of Object.entries(types)) {
    console.log(key)
      if (store.getters[`${ value.inStoreType }/schemaFor`](value.type)) {
        hash[key] = store.dispatch(`${ value.inStoreType }/findAll`, { type: value.type } );
    }
  }

  // allHash fails if any request fails
  // e.g. When there is a user without the correct permissions 2/3 resources then everything fails
  // Using allHashSettled allow UI to handle this appropriately
  const hashRes = await allHashSettled(hash).then((results)=>{
    console.log(results)
    const out = {}

    for (const [key, value] of Object.entries(results)) {
      if(value?.status === 'rejected') {
        console.error(value.reason)
      } 
      out[key] = {
        data: value.value,
        reason: value.reason,
        status: value.status
      }
    }
    return out
  });

  return hashRes
};
