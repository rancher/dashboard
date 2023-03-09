import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

import { urlFor } from '@shell/plugins/dashboard-store/getters.utils';
import { steveUrlOptions } from '@shell/plugins/steve/getters.utils';

import { SCHEMA } from '@shell/config/types';

/**
 * Handle http requests to the steve api, also cache the response
 */
export default class SteveApiClient {
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
      this.__config = { ...config };
      this.__getSchema = methods.getSchema;
      this.__updateCache = methods.updateCache;
    }

    // set config(config) { // TODO: RC if this is hit... change to updateConfig
    //   this.__config = {
    //     ...this.__config,
    //     ...config
    //   };
    // }

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
      // TODO: RC fix ${ self.location.origin }
      const opt = { url: resourceType === SCHEMA ? `${ self.location.origin }${ this.__config.url }/${ resourceType }` : undefined };

      const resourceUrl = urlFor({
        normalizeType, schemaFor: this.__getSchema, baseUrl: this.__config.url
      }, {
        type, namespace, id, opt
      });

      const resourceQuery = this.__resourceQuery(params);

      return `${ resourceUrl }${ resourceQuery }`;
    }

    request(params) {
      const opt = {
        method:  'get',
        headers: { accept: 'application/json' },
      };

      if (this.config.csrf) {
        opt.headers['x-api-csrf'] = this.csrf;
      }

      const requestUrl = this.__resourceUrl(params);

      return fetch(requestUrl, opt)
        .then((res) => {
          if (!res.ok) {
            console.warn(`Resource error retrieving resource(s)`, params.type, ':', res.json()); // eslint-disable-line no-console
          }

          return res.json();
        })
        .then((res) => {
          this.__updateCache(res.data || res, !!params.id); // TODO: RC what happens here on delete, push, etc

          return res;
        });
    }
}
