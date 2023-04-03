import { Popup, popupWindowOptions } from '@shell/utils/window';
import { parse as parseUrl, addParam } from '@shell/utils/url';
import {
  BACK_TO, SPA, _EDIT, _FLAGGED, TIMED_OUT
} from '@shell/config/query-params';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { SETTING } from '@shell/config/settings';
import { _ALL_IF_AUTHED } from '@shell/plugins/dashboard-store/actions';
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

// Load settings, which will either be just the public ones if not logged in, or all if you are
export async function checkIfItsFirstLogin(store) {
  try {
    await store.dispatch('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  {
        load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
      }
    });

    const res = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);
    const plSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);

    return {
      firstLogin: res?.value === 'true',
      plSetting
    };
  } catch (e1) {
    try {
      const res = await store.dispatch('rancher/find', {
        type: 'setting',
        id:   SETTING.FIRST_LOGIN,
        opt:  { url: `/v3/settings/${ SETTING.FIRST_LOGIN }` }
      });

      const plSetting = await store.dispatch('rancher/find', {
        type: 'setting',
        id:   SETTING.PL,
        opt:  { url: `/v3/settings/${ SETTING.PL }` }
      });

      return {
        firstLogin: res?.value === 'true',
        plSetting
      };
    } catch (e2) {
      console.error('Cannot check if it is the first login for a user', e1, e2); // eslint-disable-line no-console

      return {
        firstLogin: null,
        plSetting:  undefined
      };
    }
  }
}

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
    console.error('Error trying initial setup with default password', e); // eslint-disable-line no-console

    return false;
  }
}

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

export async function handleAuthentication(appContext, to) {
  if ( appContext.store.getters['auth/enabled'] !== false && !appContext.store.getters['auth/loggedIn'] ) {
    // `await` so we have one successfully request whilst possibly logged in (ensures fromHeader is populated from `x-api-cattle-auth`)
    await appContext.store.dispatch('auth/getUser');

    const v3User = appContext.store.getters['auth/v3User'] || {};

    if (v3User?.mustChangePassword) {
      return { redirect: { name: 'auth-setup' } };
    }

    // In newer versions the API calls return the auth state instead of having to make a new call all the time.
    const fromHeader = appContext.store.getters['auth/fromHeader'];

    if ( fromHeader === 'none' ) {
      noAuth(appContext.store);
    } else if ( fromHeader === 'true' ) {
      const me = await findMe(appContext.store);

      isLoggedIn(appContext.store, me);
    } else if ( fromHeader === 'false' ) {
      return notLoggedIn(appContext.store, to);
    } else {
      // Older versions look at principals and see what happens
      try {
        const me = await findMe(appContext.store);

        isLoggedIn(appContext.store, me);
      } catch (e) {
        const status = e?._status;

        if ( status === 404 ) {
          noAuth(appContext.store);
        } else {
          if ( status === 401 ) {
            return notLoggedIn(appContext.store, to);
          } else {
            appContext.store.commit('setError', { error: e, locationError: new Error('Auth Middleware') });
            if ( process.server ) {
              return { redirect: { path: '/fail-whale' } };
            }
          }

          return;
        }
      }
    }

    appContext.store.dispatch('gcStartIntervals');
  }
}

function isLoggedIn(store, me) {
  store.commit('auth/hasAuth', true);
  store.commit('auth/loggedInAs', me.id);
}

function notLoggedIn(store, to) {
  store.commit('auth/hasAuth', true);

  if ( to.name === 'index' ) {
    return { redirect: { path: '/auth/login' } };
  } else {
    return { redirect: { path: `/auth/login?${ TIMED_OUT }` } };
  }
}

function noAuth(store) {
  store.commit('auth/hasAuth', false);
}
