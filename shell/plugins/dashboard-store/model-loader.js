import { normalizeType } from './normalize';

const cache = {};

function find(cache, type, rootState) {
  const impl = cache[type];

  if ( impl ) {
    return impl;
  } else if ( typeof impl !== 'undefined' ) {
    return null;
  }

  try {
    const pluginModel = rootState.$plugin.getDynamic('models', type);
    let base;

    if (!pluginModel) {
      base = require(`@shell/models/${ type }`);
    } else if (typeof pluginModel === 'function') {
      // pluginModel could be an object in the case the plugin is built-in
      base = pluginModel();
    } else {
      base = pluginModel;
    }

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
export function lookup(store, type, _name, rootState) {
  type = normalizeType(type).replace(/\//g, '');

  let out;
  const tries = [
    `${ store }/${ type }`,
    type
  ];

  for ( const t of tries ) {
    out = find(cache, t, rootState);
    if ( out ) {
      return out;
    }
  }

  return null;
}

// Delete a cached model
export function clearModelCache(type) {
  delete cache[type];
}
