import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { matches } from '@shell/utils/selector';
import { get } from '@shell/utils/object';
import Trace from '@shell/plugins/steve/trace';
import { sortBy, parseField, unparseField } from '@shell/utils/sort';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/resource-class';

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
  __lastUpdated = null;
  __currentParams = {};
  __lastSent = null;

  constructor(type, getters = {}, rootGetters = {}, api, uiApi) {
    super('Base Cache');

    this.setTraceLabel(this.constructor.name);// This won't work well with minified code, but is for debug / dev only anyway

    this.type = normalizeType(type);
    this.api = api;
    this.uiApi = uiApi;
    this.rootGetters = rootGetters;
    this.getters = getters;
  }

  get currentParams() {
    return this.__currentParams;
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
  resourceList() {
    return Object.values(this.resources)
      .map(({ resource, calculatedFields }) => {
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
  all(returnWholeResource = true) {
    return this.resourceList()
      .map(({ resource, wholeResource }) => {
        return returnWholeResource ? wholeResource : resource;
      });
  }

  // gets a specific id from the cache and returns it as a whole resource if it exists
  byId(id, wholeResource = true) {
    const resource = this.resources[id];

    if (resource) {
      return {
        ...resource?.resource,
        ...(wholeResource ? calculatedFields : {}),
      };
    }
  }

  // gets a specific list of ids from the cache and returns it as a whole resource if it exists
  byIds(ids, wholeResource = true) {
    return ids
      .map(id => this.byId(id, wholeResource))
      .filter(resource => resource);
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
      namespace, id, ids, selector, searches, sortBy: sortByFields = [], page, pageSize
    } = params;

    if (id) {
      const resource = this.byId(namespace ? `${ namespace }/${ id }` : id, false);

      return { data: resource };
    }

    if (ids) {
      // const resources = ids.map(id => this.resources[id].resource);
      const resources = this.byIds(ids, false);

      return {
        totalLength:  resources.length,
        listLength:   resources.length,
        data:         resources,
        revision:     this.__revision,
        links:        this.__links,
        resourceType: this.type
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
    const resources = this.resourceList();

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
        return this.getters.findByIds(resourceName, secondaryResourceMap[resourceName]);
      });

    const finalResources = pagedResources.map(({ resource }) => resource);
    const primaryResource = {
      totalLength:  resources.length,
      listLength:   filteredResources.length,
      data:         finalResources,
      revision:     this.__revision,
      resourceType: this.type,
      status:       this.__status,
      statusText:   this.__statusText,

    };

    const response = secondaryResources.length > 0 ? [primaryResource, ...secondaryResources] : primaryResource;

    return response;
  }

  /**
   * Change the given resource in the cache
   */
  change(resource, callback) {
    // this.trace('change', resource);
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
}
