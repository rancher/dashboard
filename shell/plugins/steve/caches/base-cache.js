import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { matches } from '@shell/utils/selector';
import { get } from '@shell/utils/object';
import Trace from '@shell/plugins/steve/trace';
import { sortBy, parseField, unparseField } from '@shell/utils/sort';
import { isNull } from 'lodash';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';

export const CACHE_STATES = {
  NEW:         'new',
  REQUESTING:  'requesting',
  LOADING:     'loading',
  SUBSCRIBING: 'subscribing',
  STOPPED:     'stopped',
  READY:       'ready'
};

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

const dedupCacheNamesReducer = (cacheNames, cacheName) => {
  if (cacheNames.includes(cacheName)) {
    return cacheNames;
  }

  return [...cacheNames, cacheName];
};

/**
 * Cache for a resource type. Has various create / update / remove style functions as well as a `find` which  will fetch the resource/s if missing
 */
export default class BaseCache extends Trace {
  type;
  api = null;
  uiApi = null;
  resources = {};
  getters = {};
  rootGetters = {};
  calculatedFields = [];
  state = CACHE_STATES.NEW;
  __requests = {};
  __currentParams = {};
  __lastSent = null;
  __immediateSubCaches = null;
  __allSubCaches = null;
  __currentParentCaches = null;
  __currentPageResources = null;
  __currentPageParams = null;
  createCache = () => console.warn(`No method for creating sub-resource caches provided to cache ${ this.type }`); // eslint-disable-line no-console

  constructor(type, getters = {}, rootGetters = {}, api, uiApi, createCache) {
    super('Base Cache');

    this.setTraceLabel(this.constructor.name);// This won't work well with minified code, but is for debug / dev only anyway

    this.type = normalizeType(type);
    this.api = api;
    this.uiApi = uiApi;
    this.rootGetters = rootGetters;
    this.getters = getters;
    this.createCache = createCache;
  }

  createSubCaches() {
    this.getImmediateCacheDependencies().forEach((cacheName) => {
      // this.__immediateSubCaches = [...this.__immediateSubCaches.filter(subCache => subCache !== cacheName), cacheName];
      if (!this.__immediateSubCaches.includes(cacheName)) {
        this.__immediateSubCaches = this.__immediateSubCaches.concat(cacheName);
      }
      if (!this.getters.caches[cacheName]) {
        this.createCache(cacheName);
      }
    });

    return true;
  }

  get currentParams() {
    return this.__currentParams;
  }

  getImmediateCacheDependencies() {
    if (isNull(this.__immediateSubCaches)) {
      this.__immediateSubCaches = this.calculatedFields
        .filter(field => !!field.caches)
        .map(field => field.caches)
        .flat(1)
        .filter(cacheName => cacheName !== this.type);
    }

    return this.__immediateSubCaches;
  }

  getAllCacheDependencies({ except = [] } = {}) {
    if (isNull(this.__allSubCaches)) {
      this.__allSubCaches = this.__immediateSubCaches
        .reduce((cacheNames, cacheName) => {
          const newCacheNames = [...new Set([...cacheNames, cacheName])];
          const subCaches = this.getters.caches[cacheName]
            .getAllCacheDependencies({ except: newCacheNames })
            .filter(subCacheName => !cacheNames.includes(subCacheName));

          return [...newCacheNames, ...subCaches];
        }, [])
        .flat(1) // flatten the above should make just a flat array of strings
        .reduce(dedupCacheNamesReducer, []) // simple deduplication of cacheName strings
        .sort();
    }

    return this.__allSubCaches.filter(cacheName => except.length === 0 || !except.includes(cacheName));
  }

  __addCalculatedFields(resource) {
    const calculatedFields = {};

    this.calculatedFields.forEach(({ name, func }) => {
      const calculatedField = { [name]: func({ ...resource, ...calculatedFields }, this.getters, this.rootGetters) };

      Object.assign(calculatedFields, calculatedField); // We'll keep calculatedFields when this function finishes
    });

    // passing them back in two pieces means we keep the resource in it's original condition but still have the calculatedFields for searching/sorting operations
    return calculatedFields;
  }

  __updateCache() {
    console.warn(`Cache Class ${ this.type } did not specify a method for updating cache, nothing happened`); // eslint-disable-line no-console
  }

  __formatListResponse(listLength, data, cacheKey) {
    const {
      totalLength = 0, revision, status, statusText, links
    } = this.__requests[cacheKey] || {};

    return {
      data:         { data },
      revision,
      totalLength,
      listLength,
      resourceType: this.type,
      status,
      statusText,
      links
    };
  }

  __formatDetailResponse(data, cacheKey) { // TODO: RC only used once, simply, is it needed?
    return { data };
  }

  /**
   * Requests data from the cache's data source
   */
  async request() {
    await setTimeout(() => console.warn(`Cache Class ${ this.type } did not specify a method for requesting cache content from its source, nothing happened`), 0); // eslint-disable-line no-console

    return this;
  }

  /**
   * Sets the current cache with the payload
   */
  load() {
    console.warn(`Cache Class ${ this.type } did not specify a method for loading cache, nothing happened`); // eslint-disable-line no-console

    return this;
  }

  // checks the cache's currentParams against the new params and determines if a new request would be required to re-request from the API in order to satisfy it
  cacheIsInvalid() {
    console.warn(`Cache Class ${ this.type } did not specify a method for checking cache validity, nothing happened`); // eslint-disable-line no-console

    return true;
  }

  // get the full list of resources with both the raw resource and the whole resource (with calculated fields)
  __list({ namespace, selector, id } = {}) {
    const cacheKey = hashObj({
      namespace, selector, id
    });

    return (this.__requests[cacheKey]?.ids || Object.keys(this.resources)).map((id) => {
      const { resource, calculatedFields } = this.resources[id];
      const resourceCombo = {
        resource,
        wholeResource: {
          ...resource,
          ...calculatedFields
        }
      };

      return resourceCombo;
    });
  }

  // gets the full list of wholeResources as an array from the cache
  all(returnWholeResource = false) {
    this.trace('all');

    const cacheKey = hashObj({});
    const resources = this.__list({})
      .map(({ resource, wholeResource }) => {
        return returnWholeResource ? wholeResource : resource;
      });

    return this.__formatListResponse(resources.length, resources, cacheKey);
  }

  // gets a specific id from the cache and returns it as a whole resource if it exists
  byId(id, wholeResource = false) {
    this.trace('byId', id);

    const resource = this.resources[id];

    if (resource) {
      if (resource.resource) {
        return {
          ...resource?.resource,
          ...(wholeResource ? resource.calculatedFields : {}),
        };
      }

      return resource;
    }
  }

  // gets a specific list of ids from the cache and returns it as a whole resource if it exists
  byIds(ids, { namespace, selector, id } = {}, wholeResource = false) {
    this.trace('byIds', ids, {
      namespace, selector, id
    });

    const cacheKey = hashObj({
      namespace, selector, id
    });
    const resources = ids
      .map(id => this.byId(id, wholeResource))
      .filter(resource => resource);

    return this.__formatListResponse(resources.length, resources, cacheKey);
  }

  byPage(params) {
    this.trace('byPage', params);

    // if params are undefined then we just use whatever's in __currentPageParams, essentially repeating the page to see if it changed
    if (params) {
      this.__currentPageParams = params;
    }
    const {
      page, pageSize, namespace, selector, id
    } = this.__currentPageParams;
    const cacheKey = hashObj({
      namespace, selector, id
    });
    const secondaryResourceParams = { namespace, selector };
    const foundResources = this.__findAndSort(this.__currentPageParams);

    const pageStart = (page - 1) * pageSize;
    const pageEnd = pageStart + pageSize;

    const pagedResources = page ? foundResources.slice(pageStart, pageEnd) : foundResources;

    const secondaryResourceMap = pagedResources.reduce((acc, { wholeResource }) => {
      const subResources = wholeResource.subResources;
      const resourceNames = Object.keys(subResources || {});
      const subResourceIds = { ...acc };

      resourceNames.forEach((resourceName) => {
        subResourceIds[resourceName] = [...new Set([
          ...subResourceIds[resourceName] || [],
          ...subResources[resourceName]
        ])];
      });

      return subResourceIds;
    }, {});

    const secondaryResources = Object.keys(secondaryResourceMap)
      .map((resourceName) => {
        return this.getters.caches[resourceName].byIds(secondaryResourceMap[resourceName], secondaryResourceParams, false);
      });

    const finalResources = pagedResources.map(({ resource }) => resource);

    const formattedResponse = this.__formatListResponse(foundResources.length, finalResources, cacheKey);

    const response = secondaryResources.length > 0 ? [formattedResponse, ...secondaryResources] : formattedResponse;

    this.__currentPageResources = (Array.isArray(response) ? response : [response]).reduce((pageResourceMap, resourceResponse) => {
      const { resourceType, data: { data: resources } } = resourceResponse;

      return {
        ...pageResourceMap,
        [resourceType]: resources.map(resource => resource.id)
      };
    }, {});

    return response;
  }

  matching(selector, namespace) {
    this.trace('matching', selector, namespace);

    return this.__list({ namespace, selector }).filter(({ wholeResource }) => {
      matches();
    });
  }

  /**
   * Find the resource/s associated with the params in the cache. IF we don't have the resource/s for the params we'll fetch them
   *
   * Responses are expected in `{ data: res }` format, so anything from cache must behave like a http request
   *
   * // TODO: RC https://github.com/rancher/dashboard/issues/8420
   */
  __findAndSort({
    namespace, selector, searches, sortBy: sortByFields = []
  }) {
    this.trace('findAndSort', {
      namespace, selector, searches, sortByFields
    });

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
    const resources = this.__list({ namespace, selector });

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

    return sortByFields.length > 0 ? sortBy(filteredResources, sortByWholeResourceFields) : filteredResources;
  }

  /**
   * Change the given resource in the cache
   */
  change(resource, callback) {
    this.trace('change', resource);
    const calculatedFields = this.__addCalculatedFields(resource);

    const updatedCache = this.__updateCache(resource, calculatedFields);

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

  trace(...args) {
    super.trace(this.type, ...args);
  }
}
