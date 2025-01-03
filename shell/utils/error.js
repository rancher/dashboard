import { isArray } from '@shell/utils/array';

export class ClusterNotFoundError extends Error {
  static NAME = 'ClusterNotFoundError'

  constructor(message) {
    super(message);
    this.name = ClusterNotFoundError.NAME;
  }
}

/**
 * An error occurred and the user should be redirected to a certain location (where this is handled)
 */
export class RedirectToError extends Error {
  static NAME = 'RedirectToError'

  constructor(message, url) {
    super(message);
    this.url = url;
    this.name = RedirectToError.NAME;
  }
}

export class ApiError extends Error {
  constructor(res) {
    super(stringify(res));
    this.status = res._status || 0;
    this.statusText = res._statusText;
    this.headers = res.headers;
    this.url = res._url;
  }

  toString() {
    return `[${ this.status } ${ this.statusText }]: ${ this.message }`;
  }

  toJSON() {
    return {
      type:       'error',
      status:     this.status,
      statusText: this.statusText,
      message:    this.statusMessage,
      url:        this.url,
    };
  }
}

export function stringify(err) {
  let str;

  if ( typeof err === 'string' ) {
    str = err;
  } else if ( err && typeof err === 'object' ) {
    if ( err.message ) {
      str = err.message;

      if (typeof str === 'string') {
        try {
          const data = JSON.parse(str).data;

          if (data) {
            return data;
          }
        } catch {}
      }

      if ( err.detail ) {
        if ( str ) {
          str += ` (${ err.detail })`;
        } else {
          str = err.detail;
        }
      }
    } else if ( err.detail ) {
      str = err.detail;
    } else if ( err.url ) {
      str = `from ${ err.url }`;
    }
  }

  if (!str) {
    // Good luck...
    str = JSON.stringify(err);
  }

  return str;
}

export function exceptionToErrorsArray(err) {
  if ( err?.response?.data ) {
    const body = err.response.data;

    if ( body && body.message ) {
      return [body.message];
    } else {
      return [err];
    }
  } else if (err.status && err.message) {
    return [err.message];
  } else if ( isArray(err) ) {
    return err;
  } else {
    return [err];
  }
}

/**
 * Imported from path-to-regexp
 * @param {*} err
 * @returns
 */
export const normalizeError = (err) => {
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
};
