// Taken from @nuxt/vue-app/template/index.js
// This file was generated during Nuxt migration

import Vue from 'vue';
import { createRouter } from '../config/router.js';
import NuxtChild from '../components/nuxt/nuxt-child.js';
import App from './App.js';
import { setContext, getLocation, getRouteData, normalizeError } from '../utils/nuxt';
import { createStore } from '../config/store.js';
import { UPGRADED, _FLAGGED, _UNFLAG } from '@shell/config/query-params';
import { loadDirectives } from '@shell/directives/index';
import { installPlugins } from '@shell/initialize/plugins';

// Prevent extensions from overriding existing directives
// Hook into Vue.directive and keep track of the directive names that have been added
// and prevent an existing directive from being overwritten
const directiveNames = {};
const vueDirective = Vue.directive;

Vue.directive = function(name) {
  if (directiveNames[name]) {
    console.log(`Can not override directive: ${ name }`); // eslint-disable-line no-console

    return;
  }

  directiveNames[name] = true;

  vueDirective.apply(Vue, arguments);
};

// Load the directives from the plugins - we do this with a function so we know
// these are initialized here, after the code above which keeps track of them and
// prevents over-writes
loadDirectives(Vue);

// Component: <NuxtChild>
Vue.component(NuxtChild.name, NuxtChild);
Vue.component('NChild', NuxtChild);

async function createApp(config = {}) {
  const router = await createRouter(config);

  const store = createStore();

  // Add this.$router into store actions/mutations
  store.$router = router;

  // Create Root instance

  // here we inject the router and store to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = {
    store,
    router,
    nuxt: {
      err:     null,
      dateErr: null,
      error(err) {
        err = err || null;
        app.context._errored = Boolean(err);
        err = err ? normalizeError(err) : null;
        let nuxt = app.nuxt; // to work with @vue/composition-api, see https://github.com/nuxt/nuxt.js/issues/6517#issuecomment-573280207

        if (this) {
          nuxt = this.nuxt || this.$options.nuxt;
        }
        nuxt.dateErr = Date.now();
        nuxt.err = err;

        return err;
      }
    },
    ...App
  };

  // Make app available into store via this.app
  store.app = app;

  const next = (location) => app.router.push(location);
  // Resolve route

  const path = getLocation(router.options.base, router.options.mode);
  const route = router.resolve(path).route;

  // Set context to app.context
  await setContext(app, {
    store,
    route,
    next,
    error:   app.nuxt.error.bind(app),
    payload: undefined,
    req:     undefined,
    res:     undefined
  });

  function inject(key, value) {
    if (!key) {
      throw new Error('inject(key, value) has no key provided');
    }
    if (value === undefined) {
      throw new Error(`inject('${ key }', value) has no value provided`);
    }

    key = `$${ key }`;
    // Add into app
    app[key] = value;
    // Add into context
    if (!app.context[key]) {
      app.context[key] = value;
    }

    // Add into store
    store[key] = app[key];

    // Check if plugin not already installed
    const installKey = `__nuxt_${ key }_installed__`;

    window.installedPlugins = window.installedPlugins || {};

    if (window.installedPlugins[installKey]) {
      return;
    }
    window[window.installedPlugins] = true;
    // Call Vue.use() to install the plugin into vm
    Vue.use(() => {
      if (!Object.prototype.hasOwnProperty.call(Vue.prototype, key)) {
        Object.defineProperty(Vue.prototype, key, {
          get() {
            return this.$root.$options[key];
          }
        });
      }
    });
  }

  // Inject runtime config as $config
  inject('config', config);

  await installPlugins(app, inject, Vue);

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

  return {
    store,
    app,
    router
  };
}

export { createApp };
