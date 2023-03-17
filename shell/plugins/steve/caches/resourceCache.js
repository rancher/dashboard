
import { keyFieldFor, normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';
import { matches } from '@shell/utils/selector';
import Trace from '@shell/plugins/steve/trace';

/**
 * Cache for a resource type. Has various create / update / remove style functions as well as a `find` which  will fetch the resource/s if missing
 */
export default class ResourceCache extends Trace {
  resources = {};
  type;
  keyField;

  /**
   * Params which represent the restrictions on the current `resource` cache (namespace, selector, etc)
   */
  __currentParams = {};

  /**
   * Makes the http request to fetch the resource. Links to ResourceRequest request
   */
  __resourceRequest = () => {};

  /**
   * This property stores named functions
   */
  preCacheFields = [];

  constructor(type, resourceRequest) {
    super('Resource Cache');
    this.type = normalizeType(type);
    this.keyField = keyFieldFor(this.type);
    this.__resourceRequest = resourceRequest || this.__resourceRequest;
  }

  loadWorkerMethods(methods) {
    this.__resourceRequest = methods.resourceRequest || this.__resourceRequest;
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

  /**
   * Sets the current cache with the payload
   */
  load(payload = [], concat = false) {
    this.trace('load', payload);

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

  /**
   * Find the resource/s associated with the params in the cache. IF we don't have the resource/s for the params we'll fetch them
   *
   * Responses are expected in `{ data: res }` format, so anything from cache must behave like a http request
   *
   * // TODO: RC https://github.com/rancher/dashboard/issues/8420
   */
  find(params) {
    this.trace('find', params);
    const {
      namespace, id, selector, force
    } = params;
    const { currentNamespace, currentSelector } = this.__currentParams; // undefined means we haven't fetch any
    const newNamespace = namespace || null;
    const newSelector = selector || null;

    let request;

    if (force) {
      request = this.__resourceRequest({
        id, namespace, selector, force
      });
    } else if (id) {
      if (this.resources[id]) {
        return Promise.resolve(this.resources[id].resource);
      } else {
        request = this.__resourceRequest({
          id, namespace, selector, force
        });
      }
    } else {
      // Selectively made the http request. This covers the case where we have all resources and are interested in a subset of them
      const changed = currentNamespace !== newNamespace || currentSelector !== newSelector;
      const haveAll = currentNamespace === null && currentSelector === null;
      const haveNone = currentNamespace === undefined && currentSelector === undefined;

      if (
        !haveAll && (haveNone || changed)
      ) {
        request = this.__resourceRequest({
          id, namespace, selector
        });
      }
    }

    if (request) {
      return request.then((res) => {
        // Only set namespace/selectors if we've changed the resource cache, otherwise the state of the cache remains unchanged
        this.__currentParams.currentNamespace = newNamespace;
        this.__currentParams.currentSelector = newSelector;

        return res;
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
      return Promise.resolve({ data: Object.values(this.resources).map(resource => resource.resource) });
    }

    return Promise.resolve({
      data: Object.values(this.resources)
        .map(resource => resource.resource)
        .filter((resource) => {
          return filterConditions.every(condition => condition(resource));
        })
    });
  }

  /**
   * Change the given resource in the cache
   */
  change(resource, callback) {
    this.trace('change', resource);
    const preCacheResource = this.__addPreCacheFields(resource);

    const updatedCache = this.__updateCache(preCacheResource);

    if (updatedCache) {
      callback();
    }

    return this;
  }

  /**
   * Add the resource to the cache
   */
  create(resource, callback) {
    this.trace('create', resource);

    // ToDo: the logic for create is identical to change in these caches but the worker doesn't know that
    return this.change(resource, callback);
  }

  /**
   * Remove the resource with the given key from the cache
   */
  remove(key, callback) {
    this.trace('remove', key);
    if (this.resources[key]) {
      delete this.resources[key];
      callback();
    }

    return this;
  }
}
