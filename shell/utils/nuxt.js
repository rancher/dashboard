import Vue from 'vue';
import { normalizeURL, withQuery, withoutTrailingSlash } from 'ufo';

export function createGetCounter(counterObject, defaultKey = '') {
  return function getCounter(id = defaultKey) {
    if (counterObject[id] === undefined) {
      counterObject[id] = 0;
    }

    return counterObject[id]++;
  };
}

export function empty() {}

export function globalHandleError(error) {
  if (vueApp.config.errorHandler) {
    vueApp.config.errorHandler(error);
  }
}

export function interopDefault(promise) {
  return promise.then((m) => m.default || m);
}

export function hasFetch(vm) {
  return vm.$options && typeof vm.$options.fetch === 'function' && !vm.$options.fetch.length;
}
export function purifyData(data) {
  if (process.env.NODE_ENV === 'production') {
    return data;
  }

  return Object.entries(data).filter(
    ([key, value]) => {
      const valid = !(value instanceof Function) && !(value instanceof Promise);

      if (!valid) {
        console.warn(`${ key } is not able to be stringified. This will break in a production environment.`); // eslint-disable-line no-console
      }

      return valid;
    }
  ).reduce((obj, [key, value]) => {
    obj[key] = value;

    return obj;
  }, {});
}
export function getChildrenComponentInstancesUsingFetch(vm, instances = []) {
  const children = vm.$children || [];

  for (const child of children) {
    if (child.$fetch) {
      instances.push(child);
      continue; // Don't get the children since it will reload the template
    }
    if (child.$children) {
      getChildrenComponentInstancesUsingFetch(child, instances);
    }
  }

  return instances;
}

export function sanitizeComponent(Component) {
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
}

export function getMatchedComponents(route, matches = false, prop = 'components') {
  return Array.prototype.concat.apply([], route.matched.map((m, index) => {
    return Object.keys(m[prop]).map((key) => {
      matches && matches.push(index);

      return m[prop][key];
    });
  }));
}

export function flatMapComponents(route, fn) {
  return Array.prototype.concat.apply([], route.matched.map((m, index) => {
    return Object.keys(m.components).reduce((promises, key) => {
      if (m.components[key]) {
        promises.push(fn(m.components[key], m.instances[key], m, key, index));
      } else {
        delete m.components[key];
      }

      return promises;
    }, []);
  }));
}

export function resolveRouteComponents(route, fn) {
  return Promise.all(
    flatMapComponents(route, async(Component, instance, match, key) => {
      // If component is a function, resolve it
      if (typeof Component === 'function' && !Component.options) {
        try {
          Component = await Component();
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
      match.components[key] = Component = sanitizeComponent(Component);

      return typeof fn === 'function' ? fn(Component, instance, match, key) : Component;
    })
  );
}

export async function getRouteData(route) {
  if (!route) {
    return;
  }
  // Make sure the components are resolved (code-splitting)
  await resolveRouteComponents(route);

  // Send back a copy of route with meta based on Component definition
  return {
    ...route,
    meta: getMatchedComponents(route).map((Component, index) => {
      return { ...Component.options.meta, ...(route.matched[index] || {}).meta };
    })
  };
}

export async function setContext(app, context) {
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
}

export function middlewareSeries(promises, appContext) {
  if (!promises.length || appContext._redirected || appContext._errored) {
    return Promise.resolve();
  }

  return promisify(promises[0], appContext)
    .then(() => {
      return middlewareSeries(promises.slice(1), appContext);
    });
}

export function promisify(fn, context) {
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
}

// Imported from vue-router
export function getLocation(base, mode) {
  if (mode === 'hash') {
    return window.location.hash.replace(/^#\//, '');
  }

  base = decodeURI(base).slice(0, -1); // consideration is base is normalized with trailing slash
  let path = decodeURI(window.location.pathname);

  if (base && path.startsWith(base)) {
    path = path.slice(base.length);
  }

  const fullPath = (path || '/') + window.location.search + window.location.hash;

  return normalizeURL(fullPath);
}

// Imported from path-to-regexp
export function normalizeError(err) {
  let message;

  if (!(err.message || typeof err === 'string')) {
    try {
      message = JSON.stringify(err, null, 2);
    } catch (e) {
      message = `[${ err.constructor.name }]`;
    }
  } else {
    message = err.message || err;
  }

  return {
    ...err,
    message,
    statusCode: (err.statusCode || err.status || (err.response && err.response.status) || 500)
  };
}

export function addLifecycleHook(vm, hook, fn) {
  if (!vm.$options[hook]) {
    vm.$options[hook] = [];
  }
  if (!vm.$options[hook].includes(fn)) {
    vm.$options[hook].push(fn);
  }
}

export const stripTrailingSlash = withoutTrailingSlash;

export function setScrollRestoration(newVal) {
  try {
    window.history.scrollRestoration = newVal;
  } catch (e) {}
}
