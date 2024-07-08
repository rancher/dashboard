import Vue from 'vue';
import { updatePageTitle } from '@shell/utils/title';
import { getVendor } from '@shell/config/private-label';
import middleware from '@shell/config/middleware.js';
import { withQuery } from 'ufo';
import dynamicPluginLoader from '@shell/pkg/dynamic-plugin-loader';

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
 * Handle errors with a redirect
 * @param {*} context
 * @param {*} message
 */
const errorRedirect = (context, message) => {
  context.$store.commit('setError', { error: new Error(message) });
  context.$router.replace('/fail-whale');
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

/**
 * TODO: Define this logic use case
 * @param {*} promises
 * @param {*} appContext
 * @returns
 */
export const middlewareSeries = (promises, appContext) => {
  if (!promises.length || appContext._redirected || appContext._errored) {
    return Promise.resolve();
  }

  return promisify(promises[0], appContext)
    .then(() => {
      return middlewareSeries(promises.slice(1), appContext);
    });
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
      errorRedirect(this, new Error(`500: Unknown middleware ${ name }`));
    }

    return middleware[name];
  });

  if (unknownMiddleware) {
    return;
  }

  return middlewareSeries(midd, context);
}

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

  // Get route's matched components
  const matches = [];
  const Components = getMatchedComponents(to, matches);

  // If no Components matched, generate 404
  if (!Components.length) {
    // Handle the loading of dynamic plugins (Harvester) because we only want to attempt to load those plugins and routes if we first couldn't find a page.
    // We should probably get rid of this concept entirely and just load plugins at the start.
    await app.context.store.dispatch('loadManagement');
    const newLocation = await dynamicPluginLoader.check({ route: { path: window.location.pathname }, store: app.context.store });

    // If we have a new location, double check that it's actually valid
    const resolvedRoute = newLocation?.path ? app.context.store.app.router.resolve({ path: newLocation.path.replace(/^\/{0,1}dashboard/, '') }) : null;

    if (resolvedRoute?.route.matched.length) {
      // Note - don't use `redirect` or `store.app.route` (breaks feature by failing to run middleware in default layout)
      return next(resolvedRoute.resolved.path);
    }

    errorRedirect(this, new Error('404: This page could not be found'));

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
      errorRedirect(this, new Error(`${ validationError.statusCode || '500' }: ${ validationError.message }`));

      return next();
    }

    // ...If .validate() returned false
    if (!isValid) {
      errorRedirect(this, new Error('404: This page could not be found'));

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

/**
 * Extend component properties
 * @param {*} Component
 * @returns
 */
const patchComponent = (Component) => {
  // If Component already sanitized
  if (Component.options && Component._Ctor === Component) {
    return Component;
  }
  if (!Component.options) {
    Component = Vue.extend(Component); // fix issue #6
    Component._Ctor = Component;
  } else {
    Component._Ctor = Component;
    Component.extendOptions = Component.options;
  }
  // If no component name defined, set file path as name, (also fixes #5703)
  if (!Component.options.name && Component.options.__file) {
    Component.options.name = Component.options.__file;
  }

  return Component;
};

export const getMatchedComponents = (route, matches = false, prop = 'components') => {
  return Array.prototype.concat.apply([], route.matched.map((match, index) => {
    return Object.keys(match[prop]).map((key) => {
      matches && matches.push(index);

      return match[prop][key];
    });
  }));
};

const getComponent = async(unknownComponent) => {
  let componentView;

  // If component is a function, resolve it
  if (typeof unknownComponent === 'function' && !unknownComponent.options) {
    try {
      componentView = await unknownComponent();
    } catch (error) {
      // Handle webpack chunk loading errors
      // This may be due to a new deployment or a network problem
      if (
        error &&
        error.name === 'ChunkLoadError' &&
        typeof window !== 'undefined' &&
        window.sessionStorage
      ) {
        const timeNow = Date.now();
        const previousReloadTime = parseInt(window.sessionStorage.getItem('nuxt-reload'));

        // check for previous reload time not to reload infinitely
        if (!previousReloadTime || previousReloadTime + 60000 < timeNow) {
          window.sessionStorage.setItem('nuxt-reload', timeNow);
          window.location.reload(true /* skip cache */);
        }
      }

      throw error;
    }
  }

  return componentView || unknownComponent;
};

/**
 * Patch all the matched components of a given route
 * @param {*} route
 * @returns
 */
const patchMatchedComponents = (route) => Array.prototype.concat.apply(
  [],
  route.matched.map(
    (match, index) => Object
      .keys(match.components)
      .reduce(async(acc, key) => {
        if (match.components[key]) {
          const component = await getComponent(match.components[key], match.instances[key], match, key, index);
          const patchedComponent = patchComponent(component);

          match.components[key] = patchedComponent;
          acc.push(patchedComponent);
        } else {
          delete match.components[key];
        }

        return acc;
      }, [])
  )
);

/**
   * Merge route meta with component meta and update matched components
   * @param {*} route
   * @returns
   */
export const getRouteData = async(route) => {
  if (!route) {
    return;
  }
  // Make sure the components are resolved (code-splitting)
  await Promise.all(patchMatchedComponents(route));
  const meta = getMatchedComponents(route).map(
    (matchedComponent, index) => ({ ...matchedComponent.options.meta, ...(route.matched[index] || {}).meta })
  );

  // Send back a copy of route with meta based on Component definition
  return {
    ...route,
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
  app.context._errored = false;
  app.context.isHMR = Boolean(context.isHMR);
  app.context.params = app.context.route.params || {};
  app.context.query = app.context.route.query || {};
};
