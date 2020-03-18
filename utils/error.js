export class ClusterNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClusterNotFoundError';
  }
}

export class ApiError extends Error {
  constructor(res) {
    super(stringify(res));
    this.status = res.status || 0;
    this.statusText = res.statusText;
    this.headers = res.headers;
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
    } else if ( err && err.detail ) {
      str = err.detail;
    }
  } else {
    // Good luck...
    str = `${ err }`;
  }

  return str;
}
