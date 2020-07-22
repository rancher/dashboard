import cloneDeep from 'lodash/cloneDeep';
import flattenDeep from 'lodash/flattenDeep';
import compact from 'lodash/compact';
import pick from 'lodash/pick';
import jsonpath from 'jsonpath';
import Vue from 'vue';
import { typeOf } from './sort';

const quotedKey = /['"]/;

export function set(obj, path, value) {
  Vue.set(obj, path, value);
}

export function get(obj, path) {
  if ( path.startsWith('$') ) {
    try {
      return jsonpath.query(obj, path)[0];
    } catch (e) {
      console.log('JSON Path error', e); // eslint-disable-line no-console

      return '(JSON Path err)';
    }
  }

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

/**
 * Checks to see if the object is a simple key value pair where all values are
 * just primitives.
 * @param {any} obj
 */
export function isSimpleKeyValue(obj) {
  return obj !== null &&
    !Array.isArray(obj) &&
    typeof obj === 'object' &&
    Object.values(obj || {}).every(v => typeof v !== 'object');
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
