import { normalizeType } from './normalize';

const cache = {};

/**
 * This will lookup and load a model based on the type and appSpecializationName if specified.
 *
 * We want to have the ability to treat chart apps as if they were native resources.
 * As part of this desire to treat apps as a native resource we also want to be able to customize their models.
 * If we attempt to load an 'app' type with an 'appSpecializationName' we will first
 * load the 'app' type and then merge that with a model found in '@/models/apps/${appSpecializationName}'
 * if the file exists.
 * @param {*} type the type we'd like to lookup
 * @param {*} appSpecializationName the name of the app so we can lookup a model with the given name and merge that with the app base type.
 */
export function lookup(type, appSpecializationName) {
  type = normalizeType(type).replace(/\//g, '');

  // TODO: RC hack
  if (type === 'node') {
    console.log(type);
    if (typeof appSpecializationName === 'undefined') {
      type = 'norman-node';
    } else {
      type = 'kube-node';
    }
  }

  const impl = cache[type];

  if ( impl ) {
    return impl;
  } else if ( typeof impl !== 'undefined' ) {
    return null;
  }

  try {
    // TODO: RC hack
    if (type === 'norman-node' || type === 'kube-node') {
      // appSpecializationName will be undefined for norman nodes
      const base = require(`@/models/node/${ type }`);
      const model = { ...base.default };

      cache[type] = model;

      return model;
    }

    const base = require(`@/models/${ type }`);
    const model = { ...base.default };

    // @TODO this doesn't work at all, types are cached by only the type name, and the name of apps is `project.cattle.io.app`.
    if (type === 'app' && appSpecializationName) {
      const loaded = require(`@/models/app/${ appSpecializationName }`);

      if ( loaded?.default ) {
        Object.assign(model, loaded.default);
      }
    }

    cache[type] = model;

    return model;
  } catch (e) {
  }

  cache[type] = null;

  return null;
}
