import { updatePageTitle } from '@shell/utils/title';
import { getVendor } from '@shell/config/private-label';
import middleware from '@shell/config/middleware.js';
import {
  middlewareSeries,
  getMatchedComponents,
  setContext,
  globalHandleError,
} from '@shell/utils/nuxt.js';

// Global variable used on mount, updated on route change and used in the render function
let app;

/**
 * Add error handler debugging capabilities
 * @param {*} vueApp Vue instance
 */
export const loadDebugger = (vueApp) => {
  const debug = process.env.dev;

  if (debug) {
    const defaultErrorHandler = vueApp.config.errorHandler;

    vueApp.config.errorHandler = async(err, vm, info, ...rest) => {
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
          const vueApp = vm.$root[nuxtApp];

          vueApp.error(err);
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
};

/**
 * Trigger errors
 * @param {*} app App view instance
 */
const checkForErrors = (app) => {
  // Hide error component if no error
  if (app._hadError && app._dateLastError === app.$options.nuxt.dateErr) {
    app.error();
  }
};

/**
 * Add middleware to the Vue instance
 * @param {*} Components List of Vue components
 * @param {*} context App context
 * @returns
 */
function callMiddleware(Components, context) {
  let midd = [];
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

/**
 * Render function used by the router guards
 * @param {*} to Route
 * @param {*} from Route
 * @param {*} next callback
 * @param {*} app
 * @returns
 */
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
  await setContext(configApp, {
    route: to,
    from,
    next:  _next.bind(this)
  });
  this._dateLastError = configApp.nuxt.dateErr;
  this._hadError = Boolean(configApp.nuxt.err);

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
    await callMiddleware.call(this, [{ options: { middleware: ['authenticated'] } }], configApp.context);

    // We used to have i18n middleware which was called each time we called middleware. This is also needed to support harvester because of the way harvester loads as outlined in the comment above
    await this.$store.dispatch('i18n/init');

    if (nextCalled) {
      return;
    }

    // Show error page
    this.error({ statusCode: 404, message: 'This page could not be found' });

    return next();
  }

  try {
    // Call middleware
    await callMiddleware.call(this, Components, configApp.context);
    if (nextCalled) {
      return;
    }
    if (configApp.context._errored) {
      return next();
    }

    // Call middleware for layout
    await callMiddleware.call(this, Components, configApp.context);
    if (nextCalled) {
      return;
    }
    if (configApp.context._errored) {
      return next();
    }

    // Call .validate()
    let isValid = true;

    try {
      for (const Component of Components) {
        if (typeof Component.options.validate !== 'function') {
          continue;
        }

        isValid = await Component.options.validate(configApp.context);

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

/**
 * Mounts the Vue app to the DOM element
 * @param {Object} appPartials - App view partials
 * @param {Object} VueClass - Vue instance
 */
export async function mountApp(appPartials, VueClass) {
  // Set global variables
  app = appPartials.app;
  const router = appPartials.router;

  // Create Vue instance
  const vueApp = new VueClass(app);

  // Mounts Vue app to DOM element
  const mount = () => {
    vueApp.$mount('#app');
  };

  // Initialize error handler
  vueApp.$loading = {}; // To avoid error while vueApp.$nuxt does not exist

  // Add beforeEach router hooks
  router.beforeEach(render.bind(vueApp));
  router.beforeEach((from, to, next) => {
    if (from?.name !== to?.name) {
      updatePageTitle(getVendor());
    }

    next();
  });

  // First render on client-side
  const clientFirstMount = () => {
    checkForErrors(vueApp);
    mount();
  };

  // fix: force next tick to avoid having same timestamp when an error happen on spa fallback
  await new Promise((resolve) => setTimeout(resolve, 0));
  render.call(vueApp, router.currentRoute, router.currentRoute, (path) => {
    // If not redirected
    if (!path) {
      clientFirstMount();

      return;
    }

    // Add a one-time afterEach hook to
    // mount the app wait for redirect and route gets resolved
    const unregisterHook = configRouter.afterEach((to, from) => {
      unregisterHook();
      clientFirstMount();
    });

    // Push the path and let route to be resolved
    configRouter.push(path, undefined, (err) => {
      if (err) {
        const errorHandler = vueApp.config.errorHandler || console.error; // eslint-disable-line no-console

        errorHandler(err);
      }
    });
  });
}
