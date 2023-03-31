import { keyFieldFor } from '@shell/plugins/dashboard-store/normalize';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/resource-class';
import BaseCache, { CACHE_STATES } from '@shell/plugins/steve/caches/base-cache';
import { waitFor } from '@shell/utils/async';

/**
 * Cache for a resource type. Has various create / update / remove style functions as well as a `find` which  will fetch the resource/s if missing
 */
export default class ResourceCache extends BaseCache {
  lastFind = {};
  keyField = null;
  __revision = null;
  __links = null;
  __status = null;
  __statusText = null;
  source = 'api';
  createCache = () => console.warn(`No method for creating sub-resource caches provided to cache ${ this.type }`); // eslint-disable-line no-console

  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi);
    this.createCache = createCache;
    this.keyField = keyFieldFor(this.type);
    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }

  /**
   * Checks new hash against existing hash and updates it if different, returns boolean indicating if a change was made
   */
  __updateCache(resource, calculatedFields) {
    const resourceKey = resource[this.keyField];
    const existingResourceHash = this.resources[resourceKey];
    const newResourceHash = hashObj(resource);

    if (!newResourceHash || existingResourceHash !== newResourceHash) {
      this.resources[resourceKey] = {
        hash: newResourceHash, resource, calculatedFields
      };

      return true;
    }

    return false;
  }

  __requestSubResources(params = {}) {
    const requestParams = { namespace: params.namespace, selector: params.selector };
    const subResourceRequests = this.calculatedFields
      .filter(field => field.caches)
      .reduce((acc, field) => [...acc, ...field.caches.filter(cacheName => cacheName !== this.type)], [])
      .map((cacheName) => {
        const cache = this.getters.caches[cacheName] || this.createCache(cacheName);

        if (![CACHE_STATES.REQUESTING, CACHE_STATES.LOADING].includes(cache.state)) {
          const subRequest = cache.request({ ...requestParams, type: cacheName })
            .then((res) => {
              return res;
            });

          subRequest.type = cacheName;

          return subRequest;
        }

        const subRequest = waitFor(() => ![CACHE_STATES.REQUESTING, CACHE_STATES.LOADING].includes(cache.state)
          // !cache.cacheIsInvalid({ ...params, type: cacheName })
        );

        subRequest.type = cacheName;

        return subRequest;
      });

    return subResourceRequests;
  }

  /**
   * Requests data from the cache's data source
   */
  async request(params = {}) {
    const {
      type, namespace, id, selector, force
    } = params;

    const requestParams = {
      type, namespace, id, selector, force
    };

    const subResourceParams = {
      namespace, selector, force
    };

    const cacheRefresh = this.cacheIsInvalid(requestParams);

    let mainRequest;

    if (cacheRefresh) {
      mainRequest = this.api.request({ ...requestParams, type: this.type }, this.getters['schemaFor'])
        .then((res) => {
          return res;
        });
      this.state = CACHE_STATES.REQUESTING;
    } else {
      mainRequest = { data: {} };
    }

    const requestArray = [
      mainRequest,
      ...this.__requestSubResources(subResourceParams)
    ];

    const allRequests = await Promise.all(requestArray).then((responses) => {
      if (!id) {
        const [{
          data: {
            data, revision, links, status, statusText
          }
        }] = responses;

        if (cacheRefresh) {
          this.state = CACHE_STATES.LOADING;
          this.load(data, params, false, revision, {
            links, status, statusText
          });
        }

        return responses.filter(response => response?.data?.resourceType);
      } else {
        const [{ data, status, statusText }] = responses;

        if (cacheRefresh) {
          this.state = CACHE_STATES.LOADING;
          this.load(data, undefined, true, undefined, { status, statusText });
        }

        return responses;
      }
    });

    const flattenRequest = (request) => {
      const type = request?.data?.resourceType || request?.data?.type;
      const subRequest = [...(type ? [type] : [request])];

      return subRequest
        .filter(subRequest => subRequest?.data?.resourceType || subRequest?.data?.type)
        .map(subRequest => subRequest?.data?.resourceType || subRequest?.data?.type);
    };

    const cacheNames = allRequests.reduce((acc, request) => {
      return [...acc, flattenRequest(request)];
    }, []);

    return cacheNames;
  }

  /**
   * Sets the current cache with the payload
   */
  load(payload = [], params = {}, concat = false, revision, responseExtras = {}, indexer) {
    this.trace('load', payload);
    if (!Array.isArray(payload) && !!concat) {
      // if we're in this block then we're loading a single resource
      const calculatedFields = this.__addCalculatedFields(payload);

      this.__updateCache(payload, calculatedFields);
      this.resources[payload[this.keyField]] = {
        ...this.resources[payload[this.keyField]],
        ...responseExtras
      };

      if (indexer) {
        indexer({ ...payload, ...calculatedFields });
      }

      this.state = CACHE_STATES.READY;

      return this;
    }
    const { links, status, statusText } = responseExtras;
    let didUpdate = false;
    const { namespace: currentNamespace = null, selector: currentSelector = null } = params;

    this.__currentParams = { currentNamespace, currentSelector };

    if (!concat) {
      this.resources = {};
    }
    for (let i = 0; i < payload.length; i++) {
      const resource = payload[i];
      const calculatedFields = this.__addCalculatedFields(resource);

      const updated = this.__updateCache(resource, calculatedFields);

      if (indexer) {
        indexer({ ...resource, ...calculatedFields });
      }

      if (updated) {
        didUpdate = updated;
      }
    }
    if (didUpdate) {
      this.__lastUpdated = Date.now();
      this.__revision = revision || this.__revision;
      this.__links = links || this.__links;
      this.__status = status || this.__status;
      this.__statusText = statusText || this.__statusText;
    }

    this.state = CACHE_STATES.READY;

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
}
