import cloneDeep from 'lodash/cloneDeep';
import flattenDeep from 'lodash/flattenDeep';
import compact from 'lodash/compact';
import { JSONPath } from 'jsonpath-plus';
import Vue from 'vue';
import transform from 'lodash/transform';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import isEqual from 'lodash/isEqual';
import difference from 'lodash/difference';
import { splitObjectPath, joinObjectPath } from '@shell/utils/string';
import { addObject } from '@shell/utils/array';

export function set(obj, path, value) {
  let ptr = obj;

  if (!ptr) {
    return;
  }

  const parts = splitObjectPath(path);

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];

    if ( i === parts.length - 1 ) {
      Vue.set(ptr, key, value);
    } else if ( !ptr[key] ) {
      // Make sure parent keys exist
      Vue.set(ptr, key, {});
    }

    ptr = ptr[key];
  }

  return obj;
}

export function getAllValues(obj, path) {
  const keysInOrder = path.split('.');
  let currentValue = [obj];

  keysInOrder.forEach((currentKey) => {
    currentValue = currentValue.map((indexValue) => {
      if (Array.isArray(indexValue)) {
        return indexValue.map(arr => arr[currentKey]).flat();
      } else if (indexValue) {
        return indexValue[currentKey];
      } else {
        return null;
      }
    }).flat();
  });

  return currentValue.filter(val => val !== null);
}

export function get(obj, path) {
  if ( !path) {
    throw new Error('Cannot translate an empty input. The t function requires a string.');
  }
  if ( path.startsWith('$') ) {
    try {
      return JSONPath({
        path,
        json: obj,
        wrap: false,
      });
    } catch (e) {
      console.log('JSON Path error', e, path, obj); // eslint-disable-line no-console

      return '(JSON Path err)';
    }
  }

  if ( !path.includes('.') ) {
    return obj?.[path];
  }

  const parts = splitObjectPath(path);

  for (let i = 0; i < parts.length; i++) {
    if (!obj) {
      return;
    }

    obj = obj[parts[i]];
  }

  return obj;
}

export function remove(obj, path) {
  const parentAry = splitObjectPath(path);
  const leafKey = parentAry.pop();

  const parent = get(obj, joinObjectPath(parentAry));

  if ( parent ) {
    Vue.set(parent, leafKey, undefined);
    delete parent[leafKey];
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
  if ( !obj ) {
    return true;
  }

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
  Object.keys(obj).map((key) => {
    const val = obj[key];

    if ( Array.isArray(val) ) {
      obj[key] = val.map((each) => {
        if (each !== null && each !== undefined) {
          return cleanUp(each);
        }
      });
      if (obj[key].length === 0) {
        delete obj[key];
      }
    } else if (typeof val === 'undefined' || val === null) {
      delete obj[key];
    } else if ( isObject(val) ) {
      if (isEmpty(val)) {
        delete obj[key];
      }
      obj[key] = cleanUp(val);
    }
  });

  return obj;
}

export function definedKeys(obj) {
  const keys = Object.keys(obj).map((key) => {
    const val = obj[key];

    if ( Array.isArray(val) ) {
      return key;
    } else if ( isObject(val) ) {
      return ( definedKeys(val) || [] ).map(subkey => `${ key }.${ subkey }`);
    } else {
      return key;
    }
  });

  return compact(flattenDeep(keys));
}

export function diff(from, to) {
  from = from || {};
  to = to || {};

  // Copy values in 'to' that are different than from
  const out = transform(to, (res, toVal, k) => {
    const fromVal = from[k];

    if ( isEqual(toVal, fromVal) ) {
      return;
    }

    if ( Array.isArray(toVal) || Array.isArray(fromVal) ) {
      // Don't diff arrays, just use the whole value
      res[k] = toVal;
    } else if ( isObject(toVal) && isObject(from[k]) ) {
      res[k] = diff(fromVal, toVal);
    } else {
      res[k] = toVal;
    }
  });

  const fromKeys = definedKeys(from);
  const toKeys = definedKeys(to);

  // Return keys that are in 'from' but not 'to.'
  const missing = difference(fromKeys, toKeys);

  for ( const k of missing ) {
    set(out, k, null);
  }

  return out;
}

export function changeset(from, to, parentPath = []) {
  let out = {};

  if ( isEqual(from, to) ) {
    return out;
  }

  for ( const k in from ) {
    const path = joinObjectPath([...parentPath, k]);

    if ( !(k in to) ) {
      out[path] = { op: 'remove', path };
    } else if ( (isObject(from[k]) && isObject(to[k])) || (isArray(from[k]) && isArray(to[k])) ) {
      out = { ...out, ...changeset(from[k], to[k], [...parentPath, k]) };
    } else if ( !isEqual(from[k], to[k]) ) {
      out[path] = {
        op: 'change', from: from[k], value: to[k]
      };
    }
  }

  for ( const k in to ) {
    if ( !(k in from) ) {
      const path = joinObjectPath([...parentPath, k]);

      out[path] = { op: 'add', value: to[k] };
    }
  }

  return out;
}

export function changesetConflicts(a, b) {
  let keys = Object.keys(a).sort();
  const out = [];
  const seen = {};

  for ( const k of keys ) {
    let ok = true;
    const aa = a[k];
    const bb = b[k];

    // If we've seen a change for a parent of this key before (e.g. looking at `spec.replicas` and there's already been a change to `spec`), assume they conflict
    for ( const parentKey of parentKeys(k) ) {
      if ( seen[parentKey] ) {
        ok = false;
        break;
      }
    }

    seen[k] = true;

    if ( ok && bb ) {
      switch ( `${ aa.op }-${ bb.op }` ) {
      case 'add-add':
      case 'add-change':
      case 'change-add':
      case 'change-change':
        ok = isEqual(aa.value, bb.value);
        break;

      case 'add-remove':
      case 'change-remove':
      case 'remove-add':
      case 'remove-change':
        ok = false;
        break;

      case 'remove-remove':
      default:
        ok = true;
        break;
      }
    }

    if ( !ok ) {
      addObject(out, k);
    }
  }

  // Check parent keys going the other way
  keys = Object.keys(b).sort();
  for ( const k of keys ) {
    let ok = true;

    for ( const parentKey of parentKeys(k) ) {
      if ( seen[parentKey] ) {
        ok = false;
        break;
      }
    }

    seen[k] = true;

    if ( !ok ) {
      addObject(out, k);
    }
  }

  return out.sort();

  function parentKeys(k) {
    const out = [];
    const parts = splitObjectPath(k);

    parts.pop();

    while ( parts.length ) {
      const path = joinObjectPath(parts);

      out.push(path);
      parts.pop();
    }

    return out;
  }
}

export function applyChangeset(obj, changeset) {
  let entry;

  for ( const path in changeset ) {
    entry = changeset[path];

    if ( entry.op === 'add' || entry.op === 'change' ) {
      set(obj, path, entry.value);
    } else if ( entry.op === 'remove' ) {
      remove(obj, path);
    } else {
      throw new Error(`Unknown operation:${ entry.op }`);
    }
  }

  return obj;
}
