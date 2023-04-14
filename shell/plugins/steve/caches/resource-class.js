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

  byId(params, wholeResource = false) {
    const id = !!params.namespace ? `${ params.namespace }/${ params.id }` : params.id;
    const cacheKey = hashObj(params);

    const resource = super.byId(id, wholeResource);

    if (resource) {
      return this.__formatDetailResponse(resource, cacheKey);
    }
  }

  /**
   * Checks new hash against existing hash and updates it if different, returns boolean indicating if a change was made
   */
  __updateCache(resource, calculatedFields, cacheKey) {
    const resourceKey = resource[this.keyField];
    const existingResourceHash = this.resources[resourceKey]?.hash;
    const existingRequests = this.resources[resourceKey]?.requests || [];
    const requests = existingRequests.includes(cacheKey) ? existingRequests : [...existingRequests, cacheKey];
    const newResourceHash = hashObj(resource);

    if (existingResourceHash !== newResourceHash) {
      this.resources[resourceKey] = {
        hash: newResourceHash, resource, calculatedFields, requests
      };

      return true;
    }

    this.resources[resourceKey].requests = requests;

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

        const subRequest = waitFor(() => ![CACHE_STATES.REQUESTING, CACHE_STATES.LOADING].includes(cache.state));

        subRequest.type = cacheName;

        this.trace('request', params.type, 'secondary resource type', cacheName);

        return subRequest;
      });

    return subResourceRequests;
  }

  /**
   * Requests data from the cache's data source
   */
  async request({
    namespace, id, selector, force
  } = {}) {
    this.trace('request', {
      namespace, id, selector, force, type: this.type
    });

    const requestParams = {
      type: this.type, namespace, id, selector, force
    };

    const subResourceParams = {
      namespace, selector, force
    };

    const cacheRefresh = this.cacheIsInvalid(requestParams);

    let mainRequest;

    if (cacheRefresh) {
      this.trace('request', this.type, 'making http request for primary resource');

      mainRequest = this.api.request({ ...requestParams, type: this.type }, this.getters['schemaFor'])
        .then((res) => {
          this.trace('request', this.type, 'making http request for primary resource', 'result', res);

          return res;
        });
      this.state = CACHE_STATES.REQUESTING;
    } else {
      this.trace('request', this.type, 'skipping http request for primary resource');

      mainRequest = { data: {} };
    }

    const requestArray = [
      mainRequest,
      ...this.__requestSubResources(subResourceParams)
    ];

    this.trace('request', this.type, '!!!!', requestArray);

    const allRequests = await Promise.all(requestArray).then((responses) => {
      if (!id) {
        const [{ status, statusText, data: { data, revision, links } }] = responses;

        if (cacheRefresh) { // TODO: RC test ties in to `load` param
          this.state = CACHE_STATES.LOADING;
          this.load(
            data,
            {
              namespace, id, selector
            },
            revision,
            {
              links, status, statusText
            }
          );
        }

        const response = responses.filter(response => response?.data?.resourceType); // TODO: RC question why is this needed?

        this.trace('request', this.type, 'result not id', response );

        return response;
      } else {
        const [{ status, statusText, data }] = responses;

        if (cacheRefresh) {
          this.state = CACHE_STATES.LOADING;
          this.load(
            data,
            {
              namespace, id, selector
            },
            undefined,
            { status, statusText }
          );
        }

        this.trace('request', this.type, 'result id', responses );

        return responses;
      }
    });

    this.trace('request', this.type, 'actua response', allRequests);

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
  load(payload = [], { namespace, selector, id } = {}, revision, { links, status, statusText } = {}, indexer) {
    this.trace('load', payload);
    const cacheKey = hashObj({
      namespace, selector, id
    });

    this.__requests[cacheKey] = {
      ...this.__requests[cacheKey], // TODO: RC question why?
      totalLength: payload?.length || 1,
      ids:         this.__requests[cacheKey]?.ids || [],
      revision:    revision || this.__requests[cacheKey]?.revision,
      links:       links || this.__requests[cacheKey]?.links,
      status:      status || this.__requests[cacheKey]?.status,
      statusText:  statusText || this.__requests[cacheKey]?.statusText,
      namespace,
      selector,
      id,
      updated:     Date.now()
    };
    const resources = !Array.isArray(payload) ? [payload] : payload;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const calculatedFields = this.__addCalculatedFields(resource);

      this.__updateCache(resource, calculatedFields, cacheKey);

      if (indexer) {
        indexer({ ...resource, ...calculatedFields });
      }

      this.__requests[cacheKey].ids.push(resource[this.keyField]);
    }

    this.state = CACHE_STATES.READY;

    return this;
  }

  // checks the cache's currentParams against the new params and determines if a new request would be required to re-request from the API in order to satisfy it
  cacheIsInvalid({
    namespace, id, selector, force: forceParam
  }) {
    if (forceParam) {
      return true;
    }
    if (id && this.resources[id]) {
      return false;
    }
    const cacheKey = hashObj({
      namespace, selector, id
    });
    const haveAll = this.__requests[hashObj({})];

    if (this.__requests[cacheKey] || haveAll) {
      return false;
    }

    return true;
  }
}
