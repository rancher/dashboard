// Taken from @nuxt/vue-app/template/index.js
// This file was generated during Nuxt migration
import AppView from '@shell/initialize/App';
import { setContext, getRouteData } from '@shell/initialize/entry-helpers';
import { extendRouter } from '@shell/config/router';
import { extendStore } from '@shell/config/store';
import { UPGRADED, _FLAGGED, _UNFLAG } from '@shell/config/query-params';
import { installInjectedPlugins } from '@shell/initialize/install-plugins.js';
import { normalizeURL } from 'ufo';

/**
 * Imported from vue-router
 * @param {*} base
 * @param {*} mode
 * @returns
 */
export const getLocation = (base, mode) => {
  if (mode === 'hash') {
    return window.location.hash.replace(/^#\//, '');
  }

  base = decodeURI(base).slice(0, -1); // consideration is base is normalized with trailing slash
  let path = decodeURI(window.location.pathname);

  if (base && path.startsWith(base)) {
    path = path.slice(base.length);
  }

  const fullPath = (path || '/') + window.location.search + window.location.hash;

  return normalizeURL(fullPath);
};

/**
 * Bundle Vue app component and configuration to be executed on entry
 * @param {*} vueApp Vue instance
 * @returns
 */
async function extendApp(vueApp) {
  const config = { rancherEnv: process.env.rancherEnv, dashboardVersion: process.env.version };
  const store = extendStore();
  const router = extendRouter(config, { store });

  // Add this.$router into store actions/mutations
  store.$router = router;

  // Create Root instance

  // here we inject the router and store to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const appPartials = {
    store,
    router,
    ...AppView
  };

  // Make app available into store via this.app
  store.app = appPartials;

  const next = (location) => appPartials.router.push(location);
  // Resolve route

  const path = getLocation(router.options.base, router.options.mode);
  const route = router.resolve(path).route;

  // Set context to app.context
  await setContext(appPartials, {
    store,
    route,
    next,
    payload: undefined,
    req:     undefined,
    res:     undefined
  });

  await installInjectedPlugins(appPartials, vueApp);

  // Wait for async component to be resolved first
  await new Promise((resolve, reject) => {
    // Ignore 404s rather than blindly replacing URL in browser
    const { route } = router.resolve(appPartials.context.route.fullPath);

    if (!route.matched.length) {
      return resolve();
    }

    router.replace(appPartials.context.route.fullPath, resolve, (err) => {
      // https://github.com/vuejs/vue-router/blob/v3.4.3/src/util/errors.js
      if (!err._isRouter) {
        return reject(err);
      }
      if (err.type !== 2 /* NavigationFailureType.redirected */) {
        return resolve();
      }

      // navigated to a different route in router guard
      const unregister = router.afterEach(async(to, from) => {
        appPartials.context.route = await getRouteData(to);
        appPartials.context.params = to.params || {};
        appPartials.context.query = to.query || {};
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

  return {
    store,
    app: appPartials,
    router
  };
}

export { extendApp };
