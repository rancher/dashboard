import { routeRequiresAuthentication } from '@shell/utils/router';
import { isLoggedIn, notLoggedIn, noAuth, findMe } from '@shell/utils/auth';
import Cookie from 'cookie-universal';
import { RANCHER_AS_OIDC_QUERY_PARAMS } from '@shell/config/query-params';

const cookies = Cookie();
const RANCHER_AS_OIDC_COOKIE = 'rancher-as-oidc-prov';

function isRancherOidcProviderLogin(queryParams) {
  return queryParams && Object.keys(queryParams).length && RANCHER_AS_OIDC_QUERY_PARAMS.every((item) => Object.keys(queryParams).includes(item));
}

function handleOidcRedirectToCallbackUrl() {
  const rancherAsOidcProvider = cookies.get(RANCHER_AS_OIDC_COOKIE, { parseJSON: false });

  if (rancherAsOidcProvider) {
    window.location.href = `${ window.location.origin }/oidc/authorize${ rancherAsOidcProvider }`;
    cookies.remove(RANCHER_AS_OIDC_COOKIE);
  }
}

export function install(router, context) {
  router.beforeEach(async(to, from, next) => await authenticate(to, from, next, context));
}

/**
 * Generate an object that includes both the v3User and the me data
 * @param {*} v3User V3 user information
 * @param {*} me Me user data
 * @returns User info to be passed to `isLoggedIn`
 */
function getUserObject(v3User, me) {
  return {
    id: me.id,
    me,
    v3User,
  };
}

export async function authenticate(to, from, next, { store }) {
  if (!routeRequiresAuthentication(to)) {
    if (to.name === 'auth-login' && isRancherOidcProviderLogin(to.query)) {
      const queryString = window.location.search;

      cookies.set(RANCHER_AS_OIDC_COOKIE, queryString, {
        path:     '/',
        sameSite: true,
        secure:   true,
      });
    }

    return next();
  }

  if ( store.getters['auth/enabled'] !== false && !store.getters['auth/loggedIn'] ) {
    // `await` so we have one successfully request whilst possibly logged in (ensures fromHeader is populated from `x-api-cattle-auth`)
    await store.dispatch('auth/getUser');

    const v3User = store.getters['auth/v3User'] || {};

    if (v3User?.mustChangePassword) {
      return next({ name: 'auth-setup' });
    }

    // In newer versions the API calls return the auth state instead of having to make a new call all the time.
    const fromHeader = store.getters['auth/fromHeader'];

    if ( fromHeader === 'none' ) {
      noAuth(store);
      handleOidcRedirectToCallbackUrl();
    } else if ( fromHeader === 'true' ) {
      const me = await findMe(store);

      await isLoggedIn(store, getUserObject(v3User, me));
      handleOidcRedirectToCallbackUrl();
    } else if ( fromHeader === 'false' ) {
      notLoggedIn(store, next, to);

      return;
    } else {
      // Older versions look at principals and see what happens
      try {
        const me = await findMe(store);

        await isLoggedIn(store, getUserObject(v3User, me));
        handleOidcRedirectToCallbackUrl();
      } catch (e) {
        const status = e?._status;

        if ( status === 404 ) {
          noAuth(store);
        } else {
          if ( status === 401 ) {
            notLoggedIn(store, next, to);
          } else {
            store.commit('setError', { error: e, locationError: new Error('Auth Middleware') });
          }

          return;
        }
      }
    }

    // GC should be notified of route change before any find/get request is made that might be used for that page
    store.dispatch('gcStartIntervals');
  }

  next();
}
