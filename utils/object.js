import { cloneDeep, flattenDeep, compact, pick } from 'lodash';
import { typeOf } from './sort';

const quotedKey = /['"]/;

export function get(obj, path) {
  let parts;

  if ( path.match(quotedKey) ) {
    // Path with quoted section
    parts = path.match(/[^."']+|"([^"]*)"|'([^']*)'/g).map(x => x.replace(/['"]/g, ''));
  } else {
    // Regular path
    parts = path.split('.');
  }

  for (let i = 0; i < parts.length; i++) {
    if (!obj) {
      return;
    }

    obj = obj[parts[i]];
  }

  return obj;
}

export function getter(path) {
  return function(obj) {
    return get(obj, path);
  };
}

export function clone(obj) {
  return cloneDeep(obj);
}

export function isEmpty(obj) {
  return !Object.keys(obj).length;
}

/*
returns an object with no key/value pairs (including nested) where the value is:
  empty array
  empty object
  null
  undefined
*/
export function cleanUp(obj) {
  return pick(obj, definedValueKeys(obj));
}

function definedValueKeys(obj) {
  const validKeys = Object.keys(obj).map((key) => {
    if (typeOf(obj[key]) === 'object') {
      const recursed = definedValueKeys(obj[key]);

      if (recursed) {
        return recursed.map((subkey) => {
          return `${ key }.${ subkey }`;
        });
      }
    } else if (typeOf(obj[key]) === 'array') {
      if (compact(obj[key]).length) {
        return key;
      }
    } else if (!!obj[key] || obj[key] === 0) {
      return key;
    }
  });

  return compact(flattenDeep(validKeys));
}
