import { normalizeType } from './normalize';

const cache = {};

function find(cache, type) {
  const impl = cache[type];

  if ( impl ) {
    return impl;
  } else if ( typeof impl !== 'undefined' ) {
    return null;
  }

  try {
    const base = require(`@/models/${ type }`);

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
 * We want to have the ability to treat chart apps as if they were native resources.
 * As part of this desire to treat apps as a native resource we also want to be able to customize their models.
 * if the file exists.
 * @param {*} store the name of the store that the type comes from
 * @param {*} type the type we'd like to lookup
 */
export function lookup(store, type) {
  type = normalizeType(type).replace(/\//g, '');

  let out;
  const tries = [
    `${ store }/${ type }.class`,
    `${ type }.class`,
    `${ store }/${ type }`,
    type
  ];

  for ( const t of tries ) {
    out = find(cache, t);
    if ( out ) {
      return out;
    }
  }

  return null;
}
