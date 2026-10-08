import isEqual from 'lodash/isEqual';

export function install(router, context) {
  router.beforeEach(async(to, from, next) => await recordLastRoute(to, from, next, context));
}

export async function recordLastRoute(to, from, next, { store }) {
  try {
    // A navigation that stays on the page, eg one only changing its query, leaves the last route as it is
    const samePage = !!from && from.name === to?.name && isEqual(from.params, to?.params);

    if (samePage) {
      return next();
    }

    // - We don't want to record for auth because these handle logging in and logging out
    // - We don't want to record for index or home because these are the default pages on login and they handle the redirect given the route recorded here.
    //   If we record then we never actually redirect outside of the home page
    if (to && !to.name.includes('auth') && to.name !== 'home' && to.name !== 'index') {
      const route = {
        name:   to.name,
        params: to.params,

      };

      store.dispatch('prefs/setLastVisited', route);
    }
  } catch (e) {
    console.error('Failed record last route', e); // eslint-disable-line no-console
  }

  next();
}
