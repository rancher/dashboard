import Vue from 'vue';
import Meta from 'vue-meta';
import ClientOnly from 'vue-client-only';
import NoSsr from 'vue-no-ssr';
import { createRouter } from '../config/router.js';
import NuxtChild from '../components/nuxt/nuxt-child.js';
import NuxtError from '../layouts/error.vue';
import Nuxt from '../components/nuxt/nuxt.js';
import App from './App.js';
import { setContext, getLocation, getRouteData, normalizeError } from '../utils/nuxt';
import { createStore } from '../config/store.js';

/* Plugins */

import '../plugins/portal-vue.js';
import cookieUniversalNuxt from '../utils/cookie-universal-nuxt.js';
import axios from '../utils/axios.js';
import plugins from '../core/plugins.js';
import pluginsLoader from '../core/plugins-loader.js';
import axiosShell from '../plugins/axios';
import '../plugins/tooltip';
import '../plugins/clean-tooltip-directive';
import '../plugins/vue-clipboard2';
import '../plugins/v-select';
import '../plugins/directives';
import '../plugins/clean-html-directive';
import '../plugins/transitions';
import '../plugins/vue-js-modal';
import '../plugins/js-yaml';
import '../plugins/resize';
import '../plugins/shortkey';
import '../plugins/i18n';
import '../plugins/global-formatters';
import '../plugins/trim-whitespace';
import '../plugins/extend-router';

import consolePlugin from '../plugins/console';
import intNumber from '../plugins/int-number';
import nuxtClientInit from '../plugins/nuxt-client-init';
import replaceAll from '../plugins/replaceall';
import backButton from '../plugins/back-button';
import plugin from '../plugins/plugin';
import codeMirror from '../plugins/codemirror-loader';
import '../plugins/formatters';
import version from '../plugins/version';
import steveCreateWorker from '../plugins/steve-create-worker';

// Component: <ClientOnly>
Vue.component(ClientOnly.name, ClientOnly);

// TODO: Remove in Nuxt 3: <NoSsr>
Vue.component(NoSsr.name, {
  ...NoSsr,
  render(h, ctx) {
    if (process.client && !NoSsr._warned) {
      NoSsr._warned = true;

      console.warn('<no-ssr> has been deprecated and will be removed in Nuxt 3, please use <client-only> instead'); // eslint-disable-line no-console
    }

    return NoSsr.render(h, ctx);
  }
});

// Component: <NuxtChild>
Vue.component(NuxtChild.name, NuxtChild);
Vue.component('NChild', NuxtChild);

// Component NuxtLink is imported in server.js or client.js

// Component: <Nuxt>
Vue.component(Nuxt.name, Nuxt);

Object.defineProperty(Vue.prototype, '$nuxt', {
  get() {
    const globalNuxt = this.$root.$options.$nuxt;

    if (process.client && !globalNuxt && typeof window !== 'undefined') {
      return window.$nuxt;
    }

    return globalNuxt;
  },
  configurable: true
});

Vue.use(Meta, {
  keyName: 'head', attribute: 'data-n-head', ssrAttribute: 'data-n-head-ssr', tagIDKeyName: 'hid'
});

const defaultTransition = {
  name: 'page', mode: 'out-in', appear: true, appearClass: 'appear', appearActiveClass: 'appear-active', appearToClass: 'appear-to'
};

async function createApp(ssrContext, config = {}) {
  const router = await createRouter(ssrContext, config);

  const store = createStore(ssrContext);

  // Add this.$router into store actions/mutations
  store.$router = router;

  // Create Root instance

  // here we inject the router and store to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = {
    head: {
      title: 'dashboard',
      meta:  [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, {
        hid: 'description', name: 'description', content: 'Rancher Dashboard'
      }],
      style:  [],
      script: []
    },

    store,
    router,
    nuxt: {
      defaultTransition,
      transitions: [defaultTransition],
      setTransitions(transitions) {
        if (!Array.isArray(transitions)) {
          transitions = [transitions];
        }
        transitions = transitions.map((transition) => {
          if (!transition) {
            transition = defaultTransition;
          } else if (typeof transition === 'string') {
            transition = Object.assign({}, defaultTransition, { name: transition });
          } else {
            transition = Object.assign({}, defaultTransition, transition);
          }

          return transition;
        });
        this.$options.nuxt.transitions = transitions;

        return transitions;
      },

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
        // Used in src/server.js
        if (ssrContext) {
          ssrContext.nuxt.error = err;
        }

        return err;
      }
    },
    ...App
  };

  // Make app available into store via this.app
  store.app = app;

  const next = ssrContext ? ssrContext.next : (location) => app.router.push(location);
  // Resolve route
  let route;

  if (ssrContext) {
    route = router.resolve(ssrContext.url).route;
  } else {
    const path = getLocation(router.options.base, router.options.mode);

    route = router.resolve(path).route;
  }

  // Set context to app.context
  await setContext(app, {
    store,
    route,
    next,
    error:           app.nuxt.error.bind(app),
    payload:         ssrContext ? ssrContext.payload : undefined,
    req:             ssrContext ? ssrContext.req : undefined,
    res:             ssrContext ? ssrContext.res : undefined,
    beforeRenderFns: ssrContext ? ssrContext.beforeRenderFns : undefined,
    ssrContext
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

  if (process.client) {
    // Replace store state before plugins execution
    if (window.__NUXT__ && window.__NUXT__.state) {
      store.replaceState(window.__NUXT__.state);
    }
  }

  // Add enablePreview(previewData = {}) in context for plugins
  if (process.static && process.client) {
    app.context.enablePreview = function(previewData = {}) {
      app.previewData = Object.assign({}, previewData);
      inject('preview', previewData);
    };
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

  if (process.client && typeof consolePlugin === 'function') {
    await consolePlugin(app.context, inject);
  }

  if (process.client && typeof intNumber === 'function') {
    await intNumber(app.context, inject);
  }

  if (process.client && typeof nuxtClientInit === 'function') {
    await nuxtClientInit(app.context, inject);
  }

  if (typeof replaceAll === 'function') {
    await replaceAll(app.context, inject);
  }

  if (typeof backButton === 'function') {
    await backButton(app.context, inject);
  }

  if (process.client && typeof plugin === 'function') {
    await plugin(app.context, inject);
  }

  if (process.client && typeof codeMirror === 'function') {
    await codeMirror(app.context, inject);
  }

  if (process.client && typeof version === 'function') {
    await version(app.context, inject);
  }

  if (process.client && typeof steveCreateWorker === 'function') {
    await steveCreateWorker(app.context, inject);
  }

  // if (process.client && typeof formatters === 'function') {
  //   await formatters(app.context, inject);
  // }

  // Lock enablePreview in context
  if (process.static && process.client) {
    app.context.enablePreview = function() {
      console.warn('You cannot call enablePreview() outside a plugin.'); // eslint-disable-line no-console
    };
  }

  // Wait for async component to be resolved first
  await new Promise((resolve, reject) => {
    // Ignore 404s rather than blindly replacing URL in browser
    if (process.client) {
      const { route } = router.resolve(app.context.route.fullPath);

      if (!route.matched.length) {
        return resolve();
      }
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
        if (process.server && ssrContext && ssrContext.url) {
          ssrContext.url = to.fullPath;
        }
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

export { createApp, NuxtError };
