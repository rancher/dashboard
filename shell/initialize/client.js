// Taken from @nuxt/vue-app/template/client.js

import Vue from 'vue';
import fetch from 'unfetch';
import middleware from '../config/middleware.js';
import {
  middlewareSeries,
  getMatchedComponents,
  flatMapComponents,
  setContext,
  globalHandleError,
  urlJoin
} from '../utils/nuxt.js';
import { createApp } from './index.js';
import fetchMixin from '../mixins/fetch.client';
import { nuxtLinkAlias } from '../components/nuxt/nuxt-link.client.js'; // should be included after ./index.js
import { updatePageTitle } from '@shell/utils/title';
import { getVendor } from '@shell/config/private-label';

// Mimic old @nuxt/vue-app/template/client.js
const isDev = process.env.dev;
const debug = isDev;

// Fetch mixin
Vue.mixin(fetchMixin);

// Component: <NuxtLink>
// TODO: #9541 Remove for Vue 3 migration
Vue.component('NuxtLink', nuxtLinkAlias('NuxtLink'));
Vue.component('NLink', nuxtLinkAlias('NLink'));

if (!global.fetch) {
  global.fetch = fetch;
}

// Global shared references
let app;
let router;

const $config = nuxt.publicRuntimeConfig || {}; // eslint-disable-line no-undef

if ($config._app) {
  __webpack_public_path__ = urlJoin($config._app.cdnURL, $config._app.assetsPath); // eslint-disable-line camelcase, no-undef
}

Object.assign(Vue.config, { silent: false, performance: true });

if (debug) {
  const defaultErrorHandler = Vue.config.errorHandler;

  Vue.config.errorHandler = async(err, vm, info, ...rest) => {
    // Call other handler if exist
    let handled = null;

    if (typeof defaultErrorHandler === 'function') {
      handled = defaultErrorHandler(err, vm, info, ...rest);
    }
    if (handled === true) {
      return handled;
    }

    if (vm && vm.$root) {
      const nuxtApp = Object.keys(window.$globalApp)
        .find((nuxtInstance) => vm.$root[nuxtInstance]);

      // Show Nuxt Error Page
      if (nuxtApp && vm.$root[nuxtApp].error && info !== 'render function') {
        const currentApp = vm.$root[nuxtApp];

        currentApp.error(err);
      }
    }

    if (typeof defaultErrorHandler === 'function') {
      return handled;
    }

    // Log to console
    if (process.env.NODE_ENV !== 'production') {
      console.error(err); // eslint-disable-line no-console
    } else {
      console.error(err.message || err); // eslint-disable-line no-console
    }
  };
}

const errorHandler = Vue.config.errorHandler || console.error; // eslint-disable-line no-console

// Create and mount App
createApp(nuxt.publicRuntimeConfig).then(mountApp).catch(errorHandler); // eslint-disable-line no-undef

function callMiddleware(Components, context) {
  let midd = ['i18n'];
  let unknownMiddleware = false;

  Components.forEach((Component) => {
    if (Component.options.middleware) {
      midd = midd.concat(Component.options.middleware);
    }
  });

  midd = midd.map((name) => {
    if (typeof name === 'function') {
      return name;
    }
    if (typeof middleware[name] !== 'function') {
      unknownMiddleware = true;
      this.error({ statusCode: 500, message: `Unknown middleware ${ name }` });
    }

    return middleware[name];
  });

  if (unknownMiddleware) {
    return;
  }

  return middlewareSeries(midd, context);
}

async function render(to, from, next) {
  if (this._routeChanged === false && this._paramChanged === false && this._queryChanged === false) {
    return next();
  }

  // nextCalled is true when redirected
  let nextCalled = false;
  const _next = (path) => {
    if (from.path === path.path && this.$loading.finish) {
      this.$loading.finish();
    }

    if (from.path !== path.path && this.$loading.pause) {
      this.$loading.pause();
    }

    if (nextCalled) {
      return;
    }

    nextCalled = true;
    next(path);
  };

  // Update context
  await setContext(app, {
    route: to,
    from,
    next:  _next.bind(this)
  });
  this._dateLastError = app.nuxt.dateErr;
  this._hadError = Boolean(app.nuxt.err);

  // Get route's matched components
  const matches = [];
  const Components = getMatchedComponents(to, matches);

  // If no Components matched, generate 404
  if (!Components.length) {
    // Call the authenticated middleware. This used to attempt to load the error layout but because it was missing it would:
    // 1. load the default layout instead
    // 2. then call the authenticated middleware
    // 3. Authenticated middleware would then load plugins and check to see if there was a valid route and navigate to that if it existed
    // 4. This would allow harvester cluster pages to load on page reload
    // We should really make authenticated middleware do less...
    await callMiddleware.call(this, [{ options: { middleware: ['authenticated'] } }], app.context);

    if (nextCalled) {
      return;
    }

    // Show error page
    this.error({ statusCode: 404, message: 'This page could not be found' });

    return next();
  }

  try {
    // Call middleware
    await callMiddleware.call(this, Components, app.context);
    if (nextCalled) {
      return;
    }
    if (app.context._errored) {
      return next();
    }

    // Call middleware for layout
    await callMiddleware.call(this, Components, app.context);
    if (nextCalled) {
      return;
    }
    if (app.context._errored) {
      return next();
    }

    // Call .validate()
    let isValid = true;

    try {
      for (const Component of Components) {
        if (typeof Component.options.validate !== 'function') {
          continue;
        }

        isValid = await Component.options.validate(app.context);

        if (!isValid) {
          break;
        }
      }
    } catch (validationError) {
      // ...If .validate() threw an error
      this.error({
        statusCode: validationError.statusCode || '500',
        message:    validationError.message
      });

      return next();
    }

    // ...If .validate() returned false
    if (!isValid) {
      this.error({ statusCode: 404, message: 'This page could not be found' });

      return next();
    }

    // If not redirected
    if (!nextCalled) {
      if (this.$loading.finish && !this.$loading.manual) {
        this.$loading.finish();
      }

      next();
    }
  } catch (err) {
    const error = err || {};

    globalHandleError(error);

    this.error(error);
    next();
  }
}

// Fix components format in matched, it's due to code-splitting of vue-router
function normalizeComponents(to, ___) {
  flatMapComponents(to, (Component, _, match, key) => {
    if (typeof Component === 'object' && !Component.options) {
      // Updated via vue-router resolveAsyncComponents()
      Component = Vue.extend(Component);
      Component._Ctor = Component;
      match.components[key] = Component;
    }

    return Component;
  });
}

function checkForErrors(app) {
  // Hide error component if no error
  if (app._hadError && app._dateLastError === app.$options.nuxt.dateErr) {
    app.error();
  }
}

async function mountApp(__app) {
  // Set global variables
  app = __app.app;
  router = __app.router;

  // Create Vue instance
  const _app = new Vue(app);

  // Mounts Vue app to DOM element
  const mount = () => {
    _app.$mount('#app');

    // Add afterEach router hooks
    router.afterEach(normalizeComponents);
  };

  // Initialize error handler
  _app.$loading = {}; // To avoid error while _app.$nuxt does not exist

  // Add beforeEach router hooks
  router.beforeEach(render.bind(_app));
  router.beforeEach((from, to, next) => {
    if (from?.name !== to?.name) {
      updatePageTitle(getVendor());
    }

    next();
  });

  // First render on client-side
  const clientFirstMount = () => {
    normalizeComponents(router.currentRoute, router.currentRoute);
    checkForErrors(_app);
    mount();
  };

  // fix: force next tick to avoid having same timestamp when an error happen on spa fallback
  await new Promise((resolve) => setTimeout(resolve, 0));
  render.call(_app, router.currentRoute, router.currentRoute, (path) => {
    // If not redirected
    if (!path) {
      clientFirstMount();

      return;
    }

    // Add a one-time afterEach hook to
    // mount the app wait for redirect and route gets resolved
    const unregisterHook = router.afterEach((to, from) => {
      unregisterHook();
      clientFirstMount();
    });

    // Push the path and let route to be resolved
    router.push(path, undefined, (err) => {
      if (err) {
        errorHandler(err);
      }
    });
  });
}
