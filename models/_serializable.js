import { isArray } from '@/utils/array';

const MAX_DEPTH = 10;

export default superclass => class Serializable extends superclass {
  serialize(depth = 0) {
    if ( depth > MAX_DEPTH ) {
      return null;
    }

    const output = {};

    this.eachKeys((v, k) => {
      output[k] = recurse(v, depth + 1);
    });

    if ( this.constructor.mangleOut ) {
      return this.constructor.mangleOut(output);
    }

    return output;

    function recurse(obj, depth = 0) {
      if ( depth > MAX_DEPTH ) {
        return null;
      }

      if ( isArray(obj) ) {
        return obj.map((item) => {
          return recurse(item, depth + 1);
        });
      } else if ( obj instanceof Serializable ) {
        return obj.serialize(depth);
      } else if ( obj && typeof obj === 'object' ) {
        const out = {};

        const keys = Object.keys(obj);

        keys.forEach((k) => {
          out[k] = recurse(obj[k], depth + 1);
        });

        return out;
      } else {
        return obj;
      }
    }
  }

  allKeys() {
    return Object.keys(this);
  }

  eachKeys(fn) {
    this.allKeys().forEach((k) => {
      fn.call(this, this[k], k);
    });
  }
};
