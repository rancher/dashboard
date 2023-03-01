
import { keyFieldFor, normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';
import { matches } from '@shell/utils/selector';

export default class ResourceCache {
  resources = {};
  type;
  keyField;
  __currentParams = {};
  __resourceGetter = () => {};

  /**
   * This property stores named functions
   */
  preCacheFields = [];

  constructor(type, resourceGetter) {
    this.type = normalizeType(type);
    this.keyField = keyFieldFor(this.type);
    this.__resourceGetter = resourceGetter || this.__resourceGetter;
  }

  loadWorkerMethods(methods) {
    this.__resourceGetter = methods.resourceGetter || this.__resourceGetter;
  }

  /**
   * Checks new hash against existing hash and updates it if different, returns boolean indicating if a change was made
   */
  __updateCache(resource) {
    const resourceKey = resource[this.keyField];
    const existingResourceHash = this.resources[resourceKey];
    const newResourceHash = this.hash(resource);

    if (!newResourceHash || existingResourceHash !== newResourceHash) {
      this.resources[resourceKey] = { hash: newResourceHash, resource };

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

  /**
   * Create a hash for the given resource.
   *
   * A falsy hash will infer the resource is to be considered as new/fresh
   */
  hash(resource) {
    return hashObj(resource);
  }

  get currentParams() {
    return this.__currentParams;
  }

  load(payload = [], concat = false) {
    const singleResource = payload.length === 1;
    let id;

    if (!concat) {
      this.resources = {};
    }
    for (let i = 0; i < payload.length; i++) {
      const preCacheResource = this.__addPreCacheFields(payload[i]);

      if (singleResource) {
        id = preCacheResource[this.keyField];
      }
      this.__updateCache(preCacheResource);
    }

    if (singleResource) {
      return this.resources[id].resource;
    }

    const resourceArray = Object.values(this.resources).map((resource) => {
      return resource.resource;
    });

    return resourceArray;
  }

  find(params) {
    const { namespace, id, selector } = params;
    const { currentNamespace, currentSelector } = this.__currentParams;

    this.__currentParams.namespace = namespace || null;
    this.__currentParams.selector = selector || null;
    if (id) {
      if (this.resources[id]) {
        return Promise.resolve(this.resources[id].resource);
      }

      return this.__resourceGetter({
        id, namespace, selector
      });
    }

    if (
      (currentNamespace !== namespace || currentSelector !== selector) && // if either of these are different
      !(currentNamespace === null && currentSelector === null) // if both are null then we've got a global request
    ) {
      return this.__resourceGetter({
        id, namespace, selector
      });
    }

    const filterConditions = [];

    if (namespace) {
      filterConditions.push(resource => resource.metadata.namespace === namespace);
    }
    if (selector) {
      filterConditions.push(resource => matches(resource, selector));
    }

    if (filterConditions.length === 0) {
      return Promise.resolve(Object.values(this.resources).map(resource => resource.resource));
    }

    return Promise.resolve({
      data: Object.values(this.resources)
        .map(resource => resource.resource)
        .filter((resource) => {
          return filterConditions.every(condition => condition(resource));
        })
    });
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
