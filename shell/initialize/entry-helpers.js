import Vue from 'vue';
import { updatePageTitle } from '@shell/utils/title';
import { getVendor } from '@shell/config/private-label';
import { withQuery } from 'ufo';

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
        const globalApp = Object.keys(window.$globalApp)
          .find((instance) => vm.$root[instance]);

        // Show Nuxt Error Page
        if (globalApp && vm.$root[globalApp].error && info !== 'render function') {
          const vueApp = vm.$root[globalApp];

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
 * TODO: Define this logic use case
 * @param {*} fn
 * @param {*} context
 * @returns
 */
export const promisify = (fn, context) => {
  let promise;

  if (fn.length === 2) {
    console.warn('Callback-based fetch or middleware calls are deprecated. Please switch to promises or async/await syntax'); // eslint-disable-line no-console

    // fn(context, callback)
    promise = new Promise((resolve) => {
      fn(context, (err, data) => {
        if (err) {
          context.error(err);
        }
        data = data || {};
        resolve(data);
      });
    });
  } else {
    promise = fn(context);
  }

  if (promise && promise instanceof Promise && typeof promise.then === 'function') {
    return promise;
  }

  return Promise.resolve(promise);
};

export const globalHandleError = (error) => Vue.config.errorHandler && Vue.config.errorHandler(error);

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
  await setContext(app, {
    route: to,
    from,
    next:  _next.bind(this)
  });

  if (this.$loading.start && !this.$loading.manual) {
    this.$loading.start();
  }

  try {
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
  router.afterEach((from, to) => {
    if (from?.name !== to?.name) {
      updatePageTitle(getVendor());
    }
  });

  // First render on client-side
  const clientFirstMount = () => {
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
    const unregisterHook = router.afterEach((to, from) => {
      unregisterHook();
      clientFirstMount();
    });

    // Push the path and let route to be resolved
    router.push(path, undefined, (err) => {
      if (err) {
        const errorHandler = vueApp?.config?.errorHandler || console.error; // eslint-disable-line no-console

        errorHandler(err);
      }
    });
  });
}

export const getMatchedComponents = (route, matches = false, prop = 'components') => {
  return Array.prototype.concat.apply([], route.matched.map((match, index) => {
    return Object.keys(match[prop]).map((key) => {
      matches && matches.push(index);

      return match[prop][key];
    });
  }));
};

/**
   * Merge route meta with component meta and update matched components
   * @param {*} route
   * @returns
   */
export const getRouteData = async(route) => {
  if (!route) {
    return;
  }

  // Ensure we're working with the _value property of the route object
  const routeValue = route._value || route;

  if (!routeValue.matched) {
    // eslint-disable-next-line no-console
    console.warn('Route matched property is undefined:', routeValue);

    return routeValue;
  }

  const meta = routeValue.matched.map((record) => {
    // Merge component meta and route record meta
    const componentMeta = record.components?.default?.meta || {};
    const recordMeta = record.meta || {};

    return { ...componentMeta, ...recordMeta };
  });

  // Send back a copy of route with meta based on Component definition
  return {
    ...routeValue,
    meta
  };
};

/**
 * Add missing context for the Vue instance
 * @param {*} app
 * @param {*} context
 */
export const setContext = async(app, context) => {
  // If context not defined, create it
  if (!app.context) {
    app.context = {
      isDev:   true,
      isHMR:   false,
      app,
      store:   app.store,
      payload: context.payload,
      error:   context.error,
      base:    app.router.options.base,
      env:     {
        commit: 'head', version: '0.1.2', dev: true, pl: 1, perfTest: false, rancherEnv: 'web', api: 'http://localhost:8989'
      }
    };
    // Only set once

    if (context.req) {
      app.context.req = context.req;
    }
    if (context.res) {
      app.context.res = context.res;
    }

    app.context.redirect = (status, path, query) => {
      if (!status) {
        return;
      }
      app.context._redirected = true;
      // if only 1 or 2 arguments: redirect('/') or redirect('/', { foo: 'bar' })
      let pathType = typeof path;

      if (typeof status !== 'number' && (pathType === 'undefined' || pathType === 'object')) {
        query = path || {};
        path = status;
        pathType = typeof path;
        status = 302;
      }
      if (pathType === 'object') {
        path = app.router.resolve(path).route.fullPath;
      }
      // "/absolute/route", "./relative/route" or "../relative/route"
      if (/(^[.]{1,2}\/)|(^\/(?!\/))/.test(path)) {
        app.context.next({
          path,
          query,
          status
        });
      } else {
        path = withQuery(path, query);

        // https://developer.mozilla.org/en-US/docs/Web/API/Location/replace
        window.location.replace(path);

        // Throw a redirect error
        throw new Error('ERR_REDIRECT');
      }
    };
  }

  // Dynamic keys
  const [currentRouteData, fromRouteData] = await Promise.all([
    getRouteData(context.route),
    getRouteData(context.from)
  ]);

  if (context.route) {
    app.context.route = currentRouteData;
  }

  if (context.from) {
    app.context.from = fromRouteData;
  }

  app.context.next = context.next;
  app.context._redirected = false;
  app.context.isHMR = Boolean(context.isHMR);
  app.context.params = app.context.route.params || {};
  app.context.query = app.context.route.query || {};
};
