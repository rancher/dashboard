import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

import { SCHEMA } from '@shell/config/types';

// const urlOptions = (url, opt) => {
//   opt = opt || {};

//   // Filter
//   if ( opt.filter ) {
//     const keys = Object.keys(opt.filter);

//     keys.forEach((key) => {
//       let vals = opt.filter[key];

//       if ( !isArray(vals) ) {
//         vals = [vals];
//       }

//       vals.forEach((val) => {
//         url += `${ (url.includes('?') ? '&' : '?') + encodeURIComponent(key) }=${ encodeURIComponent(val) }`;
//       });
//     });
//   }
//   // End: Filter

//   // Limit
//   const limit = opt.limit;

//   if ( limit ) {
//     url += `${ url.includes('?') ? '&' : '?' }limit=${ limit }`;
//   }
//   // End: Limit

//   // Sort
//   const sortBy = opt.sortBy;

//   if ( sortBy ) {
//     url += `${ url.includes('?') ? '&' : '?' }sort=${ encodeURIComponent(sortBy) }`;
//   }

//   const orderBy = opt.sortOrder;

//   if ( orderBy ) {
//     url += `${ url.includes('?') ? '&' : '?' }order=${ encodeURIComponent(orderBy) }`;
//   }
//   // End: Sort

//   return url;
// };

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

    __resourceUrl(params) {
      const {
        type, id, namespace, selector
      } = params;
      const resourceType = normalizeType(type);

      if (resourceType === 'schemas') {
        return `${ self.location.origin }${ this.__config.url }/${ resourceType }`;
      }

      const [schema] = this.__getSchema(resourceType);

      const requestParts = [id ? schema.links.self : schema.links.collection];

      if (namespace) {
        requestParts.push(namespace);
      }
      if (id) {
        requestParts.push(id);
      }
      const resourceUrl = requestParts.join('/');

      // ToDo: SM add in the urlOptions here
      return resourceUrl;
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
          // ToDo: SM error checking

          return res.json();
        })
        .then((res) => {
          this.__loadCache(res.data);

          return res;
        });
    }
}
