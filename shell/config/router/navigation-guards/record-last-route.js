export function install(router, context) {
  router.beforeEach(async(to, from, next) => await recordLastRoute(to, from, next, context));
}

export async function recordLastRoute(to, from, next, { store }) {
  try {
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
