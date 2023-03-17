import { keyFieldFor, normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';
import { matches } from '@shell/utils/selector';
import Trace from '@shell/plugins/steve/trace';
import { clone, get } from '@shell/utils/object';
import { sortBy, parseField, unparseField } from '@shell/utils/sort';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/resource-class';

const searchesToFilters = (searches) => {
  const operators = {
    exact:   (values, searchTerms) => searchTerms.some(searchTerm => !searchTerm || values.includes(searchTerm)),
    prefix:  (values, searchTerms) => searchTerms.some(searchTerm => !searchTerm || values.some(value => value?.startsWith(searchTerm))),
    suffix:  (values, searchTerms) => searchTerms.some(searchTerm => !searchTerm || values.some(value => value?.endsWith(searchTerm))),
    partial: (values, searchTerms) => searchTerms.some(searchTerm => !searchTerm || values.some(value => value?.includes(searchTerm))),
  };

  return searches.map(({ fields, operator, values }) => {
    return (resource) => {
      const fieldValues = fields.map(field => field.includes('.') ? get(resource, field) : resource[field]);

      return operators[operator](fieldValues, values);
    };
  });
};

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
  preCacheFields = {};
  // the order matters here so we need this in an array instead of an object
  calculatedFields = calculatedFields;

  cacheFieldGetters = {};

  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super('Resource Cache');
    this.type = normalizeType(type);
    this.keyField = keyFieldFor(this.type);
    this.__resourceRequest = resourceRequest || this.__resourceRequest;
    this.cacheFieldGetters = cacheFieldGetters;
  }

  loadWorkerMethods(methods) {
    this.__resourceRequest = methods.resourceRequest || this.__resourceRequest;
  }

  /**
   * Checks new hash against existing hash and updates it if different, returns boolean indicating if a change was made
   */
  __updateCache(resource, calculatedFields) {
    const resourceKey = resource[this.keyField];
    const existingResourceHash = this.resources[resourceKey];
    const newResourceHash = this.hash(resource);

    if (!newResourceHash || existingResourceHash !== newResourceHash) {
      this.resources[resourceKey] = {
        hash: newResourceHash, resource, ...(calculatedFields ? { calculatedFields } : {})
      };

      return true;
    }

    return false;
  }

  /**
   * Adds any new fields to a resource prior to caching based off of the functions in the 'preCacheFields' array above
   */
  __addPreCacheFields(resource) {
    const newFields = {};

    Object.entries(this.preCacheFields).forEach(([name, func]) => {
      if (name && func instanceof Function) {
        newFields[name] = func(resource);
      }
    });

    return Object.assign({}, resource, newFields);
  }

  __addCalculatedFields(resource) {
    /**
     * the resourceClone is disposable but required for this operation since many of the calculated fields
     * build on eachother but we don't want them when we pass the resource back to the UI thread
     *  */
    const resourceClone = clone(resource);
    const calculatedFields = {};

    this.calculatedFields.forEach(({ name, func }) => {
      const calculatedField = { [name]: func(resourceClone, this.cacheFieldGetters) };

      Object.assign(calculatedFields, calculatedField);
      Object.assign(resourceClone, calculatedField);
    });

    // passing them back in two pieces means we keep the resource in it's original condition but still have the calculatedFields for searching/sorting operations
    return [resource, calculatedFields];
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
  load(payload = [], params, concat = false) {
    this.trace('load', payload);
    const { namespace: currentNamespace = null, selector: currentSelector = null } = params;

    this.__currentParams = { currentNamespace, currentSelector };

    if (!concat) {
      this.resources = {};
    }
    for (let i = 0; i < payload.length; i++) {
      const preCacheResource = this.__addPreCacheFields(payload[i]);
      const [rawResource, calculatedFields] = this.__addCalculatedFields(preCacheResource);

      this.__updateCache(rawResource, calculatedFields);
    }

    return this;
  }

  // checks the cache's currentParams against the new params and determines if a new request would be required to re-request from the API in order to satisfy it
  cacheIsInvalid(params) {
    const {
      namespace, id, selector, force: forceParam
    } = params;

    const idMissing = id && !this.resources[id];

    const newNamespace = namespace || null;
    const newSelector = selector || null;

    const { currentNamespace, currentSelector } = this.__currentParams; // undefined means we haven't fetch any
    const haveAll = currentNamespace === null && currentSelector === null;
    const changed = currentNamespace !== newNamespace || currentSelector !== newSelector;
    const haveNone = currentNamespace === undefined && currentSelector === undefined;

    return forceParam || idMissing || !haveAll || haveNone || changed;
  }

  // gets the full list of wholeResources as an array from the cache
  all() {
    return Object.values(this.resources)
      .map(({ resource, calculatedFields }) => {
        return {
          ...resource,
          ...calculatedFields
        };
      });
  }

  // gets a specific id from the cache and returns it as a whole resource if it exists
  byId(id) {
    const resource = this.resources[id];

    if (resource) {
      return {
        ...resource?.resource,
        ...resource?.calculatedFields,
      };
    }
  }

  // gets a list of wholeResources filtered by a namespace as an array from the cache (providing no namespace returns all)
  byNamespace(namespace) {
    if (namespace) {
      return this.all().filter((resource) => {
        return resource.metadata?.namespace === namespace;
      });
    }

    return this.all();
  }

  // gets a list of wholeResources filtered by a selector as an array from the cache
  matching(selector, namespace) {
    return this.byNamespace(namespace)
      .filter(resource => matches(resource, selector));
  }

  /**
   * Find the resource/s associated with the params in the cache. IF we don't have the resource/s for the params we'll fetch them
   *
   * Responses are expected in `{ data: res }` format, so anything from cache must behave like a http request
   *
   * // TODO: RC https://github.com/rancher/dashboard/issues/8420
   */
  find(params, { noRequest = false } = {}) {
    this.trace('find', params);
    const {
      namespace, id, ids, selector, searches, sortBy: sortByFields = [], page, pageSize
    } = params;

    if (id) {
      return { data: this.resources[id].resource };
    }

    if (ids) {
      const resources = ids.map(id => this.resources[id].resource);

      return {
        totalLength: resources.length, listLength: resources.length, data: resources
      };
    }

    const filterConditions = [];

    if (namespace) {
      filterConditions.push(wholeResource => wholeResource.metadata.namespace === namespace);
    }
    if (selector) {
      filterConditions.push(wholeResource => matches(wholeResource, selector));
    }
    if (searches || [].length > 0) {
      filterConditions.push(...searchesToFilters(searches));
    }

    // spread the raw resource and the calculatedFields together for the filterCondition which doesn't care about the difference
    const resources = Object.values(this.resources)
      .map(({ resource, calculatedFields }) => {
        return {
          resource,
          wholeResource: {
            ...resource,
            ...calculatedFields
          }
        };
      });

    const filteredResources = filterConditions.length === 0 ? resources : resources
      .filter(({ wholeResource }) => {
        return filterConditions.every((condition) => {
          const passed = condition(wholeResource);

          return passed;
        });
      });

    const sortByWholeResourceFields = sortByFields.map((sortBy) => {
      const { field, reverse } = parseField(sortBy);

      return unparseField({
        field: `wholeResource.${ field }`,
        reverse
      });
    });

    // ToDo: namesort not throwing an error but certainly not working either...
    const sortedResources = sortByFields.length > 0 ? sortBy(filteredResources, sortByWholeResourceFields) : filteredResources;

    const pageStart = (page - 1) * pageSize;
    const pageEnd = pageStart + pageSize;

    const pagedResources = page ? sortedResources.slice(pageStart, pageEnd) : sortedResources;
    const secondaryResources = this.calculatedFields
      .filter(field => field.cache && !caches[field.cache])
      .map((field) => {
        // const cache = caches[field.name];
        const resourceIds = pagedResources
          .map(({ wholeResource }) => {
            const ids = wholeResource[field.name].map(({ id }) => id);

            return ids;
          })
          .reduce((acc, ids) => [...acc, ...ids], []);

        return this.cacheFieldGetters.findByIds(field.cache, resourceIds);
      });

    const finalResources = pagedResources.map(({ resource }) => resource);

    return {
      totalLength: resources.length, listLength: filteredResources.length, data: finalResources, secondaryResources
    };
  }

  /**
   * Change the given resource in the cache
   */
  change(resource, callback) {
    this.trace('change', resource);
    const preCacheResource = this.__addPreCacheFields(resource);
    const [rawResource, calculatedFields] = this.__addCalculatedFields(preCacheResource);

    const updatedCache = this.__updateCache(rawResource, calculatedFields);

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
