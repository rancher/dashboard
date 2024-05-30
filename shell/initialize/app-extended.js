// Taken from @nuxt/vue-app/template/index.js
// This file was generated during Nuxt migration
import AppView from '@shell/initialize/App';
import { setContext, getLocation, getRouteData, normalizeError } from '@shell/utils/nuxt';
import { extendRouter } from '@shell/config/router';
import { extendStore } from '@shell/config/store';
import { UPGRADED, _FLAGGED, _UNFLAG } from '@shell/config/query-params';
import { installInjectedPlugins } from 'initialize/install-plugins.js';

/**
 * Bundle Vue app component and configuration to be executed on entry
 * TODO: #11070 - Remove Nuxt residuals
 * @param {*} vueApp Vue instance
 * @returns
 */
async function extendApp(vueApp) {
  const config = { rancherEnv: process.env.rancherEnv, dashboardVersion: process.env.version };
  const router = extendRouter(config);

  const store = extendStore();
  vueApp.use(store);

  // Add this.$router into store actions/mutations
  store.$router = router;

  // Create Root instance

  // here we inject the router and store to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const appPartials = {
    store,
    router,
    nuxt: {
      err:     null,
      dateErr: null,
      error(err) {
        err = err || null;
        appPartials.context._errored = Boolean(err);
        err = err ? normalizeError(err) : null;
        let nuxt = appPartials.nuxt; // to work with @vue/composition-api, see https://github.com/nuxt/nuxt.js/issues/6517#issuecomment-573280207

        if (this) {
          nuxt = this.nuxt || this.$options.nuxt;
        }
        nuxt.dateErr = Date.now();
        nuxt.err = err;

        return err;
      }
    },
    ...AppView
  };

  // Make app available into store via this.app
  store.app = appPartials;

  const next = (location) => appPartials.router.push(location);
  // Resolve route

  // TODO: #9539: Verify router possible issues
  // const path = getLocation(router.options.base, router.options.mode);
  // const route = router.resolve(path).route;
  const route = router.currentRoute.value;

  // Set context to app.context
  await setContext(appPartials, {
    store,
    route,
    next,
    error:   appPartials.nuxt.error.bind(appPartials),
    payload: undefined,
    req:     undefined,
    res:     undefined
  });

  await installInjectedPlugins(appPartials, vueApp);

  // Wait for async component to be resolved first
  await new Promise((resolve, reject) => {
    // Ignore 404s rather than blindly replacing URL in browser
    // TODO: #9539: Verify router possible issues
    // const { route } = router.resolve(appPartials.context.route.fullPath);
    const { route } = router.currentRoute.value;

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
