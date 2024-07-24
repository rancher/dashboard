import { createApp } from 'vue';
const vueApp = createApp({});

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

        // Show Error Page
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

export const globalHandleError = (error) => vueApp.config.errorHandler && vueApp.config.errorHandler(error);

/**
 * Mounts the Vue app to the DOM element
 * @param {Object} appPartials - App view partials
 * @param {Object} vueApp- Vue instance
 */
export async function mountApp(appPartials, vueApp) {
  // Initialize error handler
  vueApp.$loading = {}; // To avoid error while vueApp.$loading does not exist

  vueApp.$mount('#app');
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
export const getRouteData = (route) => {
  if (!route) {
    return;
  }

  const meta = route.matched.map((record) => record.meta || {});

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
      app,
      store:   app.store,
      payload: context.payload,
      error:   context.error,
      base:    app.router.options.base,
    };
    // Only set once
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
  app.context.params = app.context.route?.params || {};
  app.context.query = app.context.route?.query || {};
};
