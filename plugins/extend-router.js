import VueRouter from 'vue-router';
import isEqual from 'lodash/isEqual';

// We're consuming the errors of the push and replace functions based on this comment:
// https://github.com/vuejs/vue-router/issues/2881#issuecomment-520554378

const originalPush = VueRouter.prototype.push;

VueRouter.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalPush.call(this, location, onResolve, onReject);
  }

  return originalPush?.call(this, location)?.catch((err) => {
    if (VueRouter.isNavigationFailure(err)) {
      // If there really is an error, throw it
      return Promise.reject(err);
    }

    // Otherwise resolve to false to indicate the original push call didn't go to its original destination.
    return Promise.resolve(false);
  });
};

const originalReplace = VueRouter.prototype.replace;

VueRouter.prototype.replace = function replace(location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalReplace.call(this, location, onResolve, onReject);
  }

  return originalReplace.call(this, location).catch((err) => {
    if (VueRouter.isNavigationFailure(err)) {
      // resolve err
      return err;
    }

    // rethrow error
    return Promise.reject(err);
  });
};

VueRouter.prototype.applyQuery = function(qp, defaults = {}) {
  const query = queryParamsFor(this.currentRoute.query, qp, defaults);
  const hash = this.currentRoute.hash || '';

  if ( isEqual(query, this.currentRoute.query) ) {
    return;
  }

  return this.replace({ query, hash }).catch((err) => {
    if ( err?.name === 'NavigationDuplicated' ) {
      // Do nothing, this is fine...
      // https://github.com/vuejs/vue-router/issues/2872
    } else {
      throw err;
    }
  });
};

export function queryParamsFor(current, qp, defaults = {}) {
  const query = Object.assign({}, current || {});

  for ( const key of Object.keys(qp) ) {
    const val = qp[key];

    if ( typeof defaults[key] === 'undefined' ) {
      // There is no default
      query[key] = qp[key];
    } else if ( defaults[key] === false ) {
      // Value-less boolean flags
      if ( val ) {
        query[key] = null;
      } else {
        delete query[key];
      }
    } else if ( val === defaults[key] ) {
      // The value is the default
      delete query[key];
    } else {
      // The value is not the default
      query[key] = val;
    }
  }

  return query;
}
