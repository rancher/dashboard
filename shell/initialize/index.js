// Taken from @nuxt/vue-app/template/index.js
// This file was generated during Nuxt migration

import Vue from 'vue';
import { createRouter } from '../config/router.js';
import NuxtChild from '../components/nuxt/nuxt-child.js';
import Nuxt from '../components/nuxt/nuxt.js';
import App from './App.js';
import { setContext, getLocation, getRouteData, normalizeError } from '../utils/nuxt';
import { createStore } from '../config/store.js';

/* Plugins */
import { loadDirectives } from '@shell/plugins';
import '../plugins/portal-vue.js';
import cookieUniversalNuxt from '../utils/cookie-universal-nuxt.js';
import axios from '../utils/axios.js';
import plugins from '../core/plugins.js';
import pluginsLoader from '../core/plugins-loader.js';
import axiosShell from '../plugins/axios';
import '../plugins/tooltip';
import '../plugins/v-select';
import '../plugins/vue-js-modal';
import '../plugins/js-yaml';
import '../plugins/resize';
import '../plugins/shortkey';
import '../plugins/i18n';
import '../plugins/global-formatters';
import '../plugins/trim-whitespace';
import '../plugins/extend-router';

import intNumber from '../plugins/int-number';
import positiveIntNumber from '../plugins/positive-int-number.js';
import nuxtClientInit from '../plugins/nuxt-client-init';
import replaceAll from '../plugins/replaceall';
import backButton from '../plugins/back-button';
import plugin from '../plugins/plugin';
import codeMirror from '../plugins/codemirror-loader';
import '../plugins/formatters';
import version from '../plugins/version';
import steveCreateWorker from '../plugins/steve-create-worker';

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
loadDirectives();

// Component: <NuxtChild>
Vue.component(NuxtChild.name, NuxtChild);
Vue.component('NChild', NuxtChild);

// Component NuxtLink is imported in server.js or client.js

// Component: <Nuxt>
Vue.component(Nuxt.name, Nuxt);

Object.defineProperty(Vue.prototype, '$nuxt', {
  get() {
    const globalNuxt = this.$root.$options.$nuxt;

    if (!globalNuxt && typeof window !== 'undefined') {
      return window.$nuxt;
    }

    return globalNuxt;
  },
  configurable: true
});

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

    if (Vue[installKey]) {
      return;
    }
    Vue[installKey] = true;
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

  // Replace store state before plugins execution
  if (window.__NUXT__ && window.__NUXT__.state) {
    store.replaceState(window.__NUXT__.state);
  }

  // Plugin execution

  // if (typeof nuxt_plugin_portalvue_6babae27 === 'function') {
  //   await nuxt_plugin_portalvue_6babae27(app.context, inject);
  // }

  if (typeof cookieUniversalNuxt === 'function') {
    await cookieUniversalNuxt(app.context, inject);
  }

  if (typeof axios === 'function') {
    await axios(app.context, inject);
  }

  if (typeof plugins === 'function') {
    await plugins(app.context, inject);
  }

  if (typeof pluginsLoader === 'function') {
    await pluginsLoader(app.context, inject);
  }

  if (typeof axiosShell === 'function') {
    await axiosShell(app.context, inject);
  }

  if (typeof intNumber === 'function') {
    await intNumber(app.context, inject);
  }

  if (typeof positiveIntNumber === 'function') {
    await positiveIntNumber(app.context, inject);
  }

  if (typeof nuxtClientInit === 'function') {
    await nuxtClientInit(app.context, inject);
  }

  if (typeof replaceAll === 'function') {
    await replaceAll(app.context, inject);
  }

  if (typeof backButton === 'function') {
    await backButton(app.context, inject);
  }

  if (typeof plugin === 'function') {
    await plugin(app.context, inject);
  }

  if (typeof codeMirror === 'function') {
    await codeMirror(app.context, inject);
  }

  if (typeof version === 'function') {
    await version(app.context, inject);
  }

  if (typeof steveCreateWorker === 'function') {
    await steveCreateWorker(app.context, inject);
  }

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
  });

  return {
    store,
    app,
    router
  };
}

export { createApp };
