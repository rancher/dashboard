import { COUNT } from '@shell/config/types';
import { keyFieldFor, normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';

export default class ResourceCache {
  resources = {};
  type;
  keyField;

  /**
   * This property stores named functions
   */
  preCacheFields = [];

  constructor(type) {
    this.type = normalizeType(type === 'counts' ? COUNT : type);
    this.keyField = keyFieldFor(this.type);
  }

  /**
   * Checks new hash against existing hash and updates it if different, returns boolean indicating if a change was made
   */
  __updateCache(resource) {
    const resourceKey = resource[this.keyField];
    const existingResourceHash = this.resources[resourceKey];
    const newResourceHash = hashObj(resource);

    if (existingResourceHash !== newResourceHash) {
      this.resources[resourceKey] = newResourceHash;

      return true;
    }

    return false;
  }

  /**
   * Adds any new fields to a resource prior to caching based off of the functions in the 'preCacheFields' array above
   */
  __addPreCacheFields(resource) {
    const newFields = {};

    Object.entries(this.preCacheFields).forEach(([name, fieldFunc]) => {
      if (name && fieldFunc instanceof Function) {
        newFields[name] = fieldFunc(resource);
      }
    });

    return Object.assign({}, resource, newFields);
  }

  load(collection = []) {
    for (let i = 0; i < collection.length; i++) {
      const preCacheResource = this.__addPreCacheFields(collection[i]);

      this.__updateCache(preCacheResource);
    }

    return this;
  }

  change(resource, callback) {
    const preCacheResource = this.__addPreCacheFields(resource);

    const updatedCache = this.__updateCache(preCacheResource);

    if (updatedCache) {
      callback();
    }

    return this;
  }

  create(resource, callback) {
    // ToDo: the logic for create is identical to change in these caches but the worker doesn't know that
    return this.change(resource, callback);
  }

  remove(key, callback) {
    if (this.resources[key]) {
      delete this.resources[key];
      callback();
    }

    return this;
  }
}
