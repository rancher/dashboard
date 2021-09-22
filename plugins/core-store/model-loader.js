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

    // Older proxy models
    const model = { ...base.default };

    cache[type] = model;

    return model;
  } catch (e) {
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
  const tries = [
    `${ type }.class`,
    type
  ];

  for ( const t of tries ) {
    try {
      out = find(cache, require(`@/plugins/app-extension/${ store }/models/${ t }`), type);
      if ( out ) {
        return out;
      }
    } catch (e) {
    }

    try {
      out = find(cache, require(`@/models/${ store }/${ t }`), type);
      if ( out ) {
        return out;
      }
    } catch (e) {
    }

    try {
      out = find(cache, require(`@/models/${ t }`), type);
      if ( out ) {
        return out;
      }
    } catch (e) {
    }
  }

  return null;
}
