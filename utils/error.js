export class ClusterNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClusterNotFoundError';
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
