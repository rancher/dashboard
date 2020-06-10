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
  } else {
    // Good luck...
    str = `${ err }`;
  }

  return str;
}
