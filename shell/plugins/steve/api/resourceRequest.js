import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

import { urlFor } from '@shell/plugins/dashboard-store/getters.utils';
import { steveUrlOptions } from '@shell/plugins/steve/getters.utils';

import { SCHEMA } from '@shell/config/types';
import Trace from '@shell/plugins/steve/trace';

/**
 * Handle http requests to the steve api, also cache the response
 */
export default class ResourceRequest extends Trace {
    /**
     * Function that will fetch the schema for a given resource type
     */
    __getSchema;

    /**
     * Fetch and update the cache for the resource associated with the request
     */
    __updateCache;

    /**
     * Configuration required to make http requests
     */
    __config = {};

    constructor(config, methods = {}) {
      super('Resource Requester');
      this.__config = { ...config };
      this.__getSchema = methods.getSchema;
      this.__updateCache = methods.updateCache;
    }

    get config() {
      return this.__config;
    }

    loadWorkerMethods(methods) {
      this.__getSchema = methods.getSchema || this.__getSchema;
      this.__updateCache = methods.updateCache || this.__updateCache;
    }

    __resourceQuery(params) {
      return steveUrlOptions('', params);
    }

    __resourceUrl(params) {
      const { type, id, namespace } = params;

      const resourceType = normalizeType(type);
      const opt = { url: resourceType === SCHEMA ? `${ this.__config.url }/${ resourceType }` : undefined };

      const resourceUrl = urlFor({
        normalizeType, schemaFor: this.__getSchema, baseUrl: this.__config.url
      }, {
        type, namespace, id, opt
      });

      const resourceQuery = this.__resourceQuery(params);

      return `${ resourceUrl }${ resourceQuery }`;
    }

    /**
     * Make the http request
     */
    request(params) {
      this.trace('Request', params);

      const opt = {
        method:  'get',
        headers: { accept: 'application/json' },
      };

      if (this.config.csrf) {
        opt.headers['x-api-csrf'] = this.__config.csrf;
      }

      const requestUrl = this.__resourceUrl(params);

      // fetch itself will reject a promise if the server fails to send a response (no connection, server not responding, etc)
      return fetch(requestUrl, opt)
        .then(async(res) => {
          // The server returned a response
          if (res.ok) {
            return {
              status:     res.status,
              statusText: res.statusText,
              // headers:    res.headers, // headers won't serialise to send between threads
              data:       await res.json()
            };
          }

          throw new Error(`Error making resource(s) http request: ${ params.type }`, { cause: { response: res } });
        })
        .then((res) => {
          // TODO: RC https://github.com/rancher/dashboard/issues/8420
          this.__updateCache(params.type, res.data.data || res.data, !!params.id);

          return res;
        });
    }
}
