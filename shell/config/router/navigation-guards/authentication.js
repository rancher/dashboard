import { routeRequiresAuthentication } from '@shell/utils/router';
import { isLoggedIn, notLoggedIn, noAuth, findMe, isLocalUser } from '@shell/utils/auth';
import { RANCHER_AS_OIDC_QUERY_PARAMS } from '@shell/config/query-params';

const R_OIDC_PROV_PARAMS = 'rancher-as-oidc-prov-params';

/**
 * Detect if we've come from an OIDC client
 */
function isRancherOidcProviderLogin(queryParams) {
  return queryParams && Object.keys(queryParams).length && RANCHER_AS_OIDC_QUERY_PARAMS.every((item) => Object.keys(queryParams).includes(item));
}

/**
 * If we've logged in on a request from an OIDC client return to it
 */
function handleOidcRedirectToCallbackUrl() {
  const rancherAsOidcProvider = sessionStorage.getItem(R_OIDC_PROV_PARAMS);

  if (rancherAsOidcProvider) {
    window.location.href = `${ window.location.origin }/oidc/authorize${ rancherAsOidcProvider }&code_challenge_method=S256`;
    sessionStorage.removeItem(R_OIDC_PROV_PARAMS);
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
    if (to.name === 'auth-login') {
      if (isRancherOidcProviderLogin(to.query)) {
        // If redirected here from an oidc client persist the values we need to return to it once rancher auth is complete...
        sessionStorage.setItem(R_OIDC_PROV_PARAMS, window.location.search);
      } else if (sessionStorage.getItem(R_OIDC_PROV_PARAMS)) {
        // ... otherwise clear it (to avoid a redirect to it on successful log in)
        sessionStorage.removeItem(R_OIDC_PROV_PARAMS);
      }
    }

    return next();
  }

  if ( store.getters['auth/enabled'] !== false && !store.getters['auth/loggedIn'] ) {
    // `await` so we have one successfully request whilst possibly logged in (ensures fromHeader is populated from `x-api-cattle-auth`)
    await store.dispatch('auth/getUser');

    const v3User = store.getters['auth/v3User'] || {};

    // Only redirect to setup if user must change password AND is a local user
    // Auth provider users (OAuth, SAML, etc.) don't have passwords managed by Rancher
    if (v3User?.mustChangePassword && isLocalUser(v3User)) {
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
