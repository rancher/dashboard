import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { isArray } from '@shell/utils/array';

import { SCHEMA } from '@shell/config/types';

export default class SteveClient {
    __getSchema;
    __loadCache;
    __config = {};
    __requestQueue = [];

    constructor(config, methods = {}) {
      this.__config = { ...config };
      this.__getSchema = methods.getSchema || this.__getSchema;
      this.__loadCache = methods.loadCache || this.__loadCache;
    }

    set config(config) {
      this.__config = {
        ...this.__config,
        ...config
      };
    }

    get config() {
      return this.__config;
    }

    loadWorkerMethods(methods) {
      this.__getSchema = methods.getSchema || this.__getSchema;
      this.__loadCache = methods.loadCache || this.__loadCache;
    }

    __resourceQuery(params) {
      const {
        limit, filter, sortBy, sortOrder
      } = params;
      const query = [];

      // Filter
      if ( filter ) {
        const keys = Object.keys(filter);

        keys.forEach((key) => {
          let vals = filter[key];

          if ( !isArray(vals) ) {
            vals = [vals];
          }

          vals.forEach((val) => {
            query.push(`${ encodeURIComponent(key) }=${ encodeURIComponent(val) }`);
          });
        });
      }
      // End: Filter

      // Limit
      if ( limit ) {
        query.push(`limit=${ limit }`);
      }
      // // End: Limit

      // Sort
      if ( sortBy ) {
        query.push(`sort=${ encodeURIComponent(sortBy) }`);
      }

      if ( sortOrder ) {
        query.push(`order=${ encodeURIComponent(sortOrder) }`);
      }
      // End: Sort

      return query.length > 0 ? `?${ query.join('&') }` : '';
    }

    __resourceUrl(params) {
      const { type, id, namespace } = params;

      const resourceType = normalizeType(type);

      if (resourceType === SCHEMA) {
        return `${ self.location.origin }${ this.__config.url }/${ resourceType }`;
      }

      const schema = this.__getSchema(resourceType);
      const requestParts = [schema.links.collection];

      if (namespace) {
        requestParts.push(namespace);
      }
      if (id) {
        requestParts.push(id);
      }
      const resourceUrl = requestParts.join('/');
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
          this.__loadCache(res.data || res, !!params.id);

          return res;
        });
    }
}
