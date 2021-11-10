import { normalizeType } from './normalize';

const cache = {};

function find(cache, base, type) {
  const impl = cache[type];

  if ( impl ) {
    return impl;
  } else if ( typeof impl !== 'undefined' ) {
    return null;
  }

  try {
    // New Class models
    if ( base?.default?.prototype ) {
      cache[type] = base.default;

      return base.default;
    }
  } catch (e) {
    if ( e?.code !== 'MODULE_NOT_FOUND' ) {
      // eslint-disable-next-line no-console
      console.error('Find error', type, e);
    }
  }

  cache[type] = null;

  return null;
}

/**
 * This will lookup and load a model based on the type
 *
 * @param {*} store the name of the store that the type comes from
 * @param {*} type the type we'd like to lookup
 */
export function lookup(store, type) {
  type = normalizeType(type).replace(/\//g, '');

  let out;

  try {
    out = find(cache, require(`@/products/${ store }/models/${ type }`), `${ store }/${ type }`);
    if ( out ) {
      return out;
    }
  } catch (e) {
  }

  try {
    out = find(cache, require(`@/models/${ store }/${ type }`), `${ store }/${ type }`);
    if ( out ) {
      return out;
    }
  } catch (e) {
  }

  try {
    out = find(cache, require(`@/models/${ type }`), type);
    if ( out ) {
      return out;
    }
  } catch (e) {
  }

  return null;
}
