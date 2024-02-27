import { setFavIcon, haveSetFavIcon } from '@shell/utils/favicon';
import { MANAGEMENT } from '@shell/config/types';
import { getRouteData } from '../utils/nuxt';
import { UPGRADED, _FLAGGED, _UNFLAG } from '@shell/config/query-params';
import { _ALL_IF_AUTHED } from '@shell/plugins/dashboard-store/actions';

export async function installRouteGuards(app) {
  const { router, store } = app;

  router.beforeResolve(async(to, from, next) => {
    // We don't need to hold up rendering waiting for the icon to be set
    next();
    try {
      if (!haveSetFavIcon()) {
        // Load settings, which will either be just the public ones if not logged in, or all if you are
        await store.dispatch('management/findAll', {
          type: MANAGEMENT.SETTING,
          opt:  {
            load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
          }
        });

        // Set the favicon - use custom one from store if set
        setFavIcon(store);
      }
    } catch (ex) {}
  });

  // Wait for async component to be resolved first
  await new Promise((resolve, reject) => {
    // Ignore 404s rather than blindly replacing URL in browser
    const { route } = router.resolve(app.context.route.fullPath);

    if (!route.matched.length) {
      return resolve();
    }

    router.replace(app.context.route.fullPath, resolve, (err) => {
      // https://github.com/vuejs/vue-router/blob/v3.4.3/src/util/errors.js
      if (!err._isRouter) {
        return reject(err);
      }
      if (err.type !== 2 /* NavigationFailureType.redirected */) {
        return resolve();
      }

      // navigated to a different route in router guard
      const unregister = router.afterEach(async(to, from) => {
        app.context.route = await getRouteData(to);
        app.context.params = to.params || {};
        app.context.query = to.query || {};
        unregister();
        resolve();
      });
    });

    router.afterEach((to) => {
      const upgraded = to.query[UPGRADED] === _FLAGGED;

      if ( upgraded ) {
        router.applyQuery({ [UPGRADED]: _UNFLAG });

        store.dispatch('growl/success', {
          title:   store.getters['i18n/t']('serverUpgrade.title'),
          message: store.getters['i18n/t']('serverUpgrade.message'),
          timeout: 0,
        });
      }
    });
  });
}
