import { routeRequiresAuthentication } from '@shell/utils/router';
import { isLoggedIn, notLoggedIn, noAuth, findMe } from '@shell/utils/auth';

export function install(router, context) {
  router.beforeEach(async(to, from, next) => await authenticate(to, from, next, context));
}

export async function authenticate(to, from, next, { store }) {
  if (!routeRequiresAuthentication(to)) {
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
    } else if ( fromHeader === 'true' ) {
      const me = await findMe(store);

      isLoggedIn(store, me);
    } else if ( fromHeader === 'false' ) {
      notLoggedIn(store, next, to);

      return;
    } else {
      // Older versions look at principals and see what happens
      try {
        const me = await findMe(store);

        isLoggedIn(store, me);
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
