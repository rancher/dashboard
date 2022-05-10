import { isArray } from '@shell/utils/array';

export class ClusterNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClusterNotFoundError';
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
