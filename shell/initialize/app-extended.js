// Taken from @nuxt/vue-app/template/index.js
// This file was generated during Nuxt migration
import AppView from '@shell/initialize/App';
import { setContext, getLocation, normalizeError } from '@shell/utils/nuxt';
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
  const path = getLocation(router.options.base, router.options.mode);
  const route = router.resolve(path).route;

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

  return {
    store,
    app: appPartials,
    router
  };
}

export { extendApp };
