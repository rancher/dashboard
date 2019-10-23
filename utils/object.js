import { cloneDeep } from 'lodash';

export function get(obj, path) {
  const parts = path.split('.');

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
