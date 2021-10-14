import https from 'https';

import { SCHEMA } from '@/config/types';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/products/epinio/types';
import { normalizeType } from '@/plugins/core-store/normalize';
import { handleSpoofedRequest } from '@/plugins/core-store/actions';
import { base64Encode } from '@/utils/crypto';

export default {
  remove({ commit }, obj ) {
    commit('remove', obj);
  },

  async request({ rootGetters, dispatch }, { opt, type }) {
    const spoofedRes = await handleSpoofedRequest(rootGetters, EPINIO_PRODUCT_NAME, opt);

    if (spoofedRes) {
      return spoofedRes;
    }

    // @TODO queue/defer duplicate requests
    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    opt.httpsAgent = new https.Agent({ rejectUnauthorized: false });

    await dispatch('findAll', { type: EPINIO_TYPES.INSTANCE });
    const currentClusterId = rootGetters['clusterId'];
    const currentCluster = rootGetters['epinio/byId'](EPINIO_TYPES.INSTANCE, currentClusterId);

    opt.headers = {
      ...opt.headers,
      'x-api-host':  currentCluster.api,
      Authorization: `Basic ${ base64Encode(`${ currentCluster.username }:${ currentCluster.password }`) }`
    };

    return this.$axios(opt).then((res) => {
      if ( opt.depaginate ) {
        // @TODO but API never sends it
        /*
        return new Promise((resolve, reject) => {
          const next = res.pagination.next;
          if (!next ) [
            return resolve();
          }

          dispatch('request')
        });
        */
      }

      if ( opt.responseType ) {
        return res;
      } else {
        const out = res.data || {};

        // TODO: API - namespaces call returns array of strings!
        if (Array.isArray(out)) {
          res.data = {
            data: out.map(o => ({
              ...o,
              id: o.name,
              type // TODO: RC get from url
            }))
          };
        } else {
          // `find` action turns this into `{data: out}`
          res.data = {
            ...out,
            id: out.name,
            type
          };
        }

        return responseObject(res);
      }
    }).catch((err) => {
      if ( !err || !err.response ) {
        return Promise.reject(err);
      }

      const res = err.response;

      // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
      if ( opt.redirectUnauthorized !== false && process.client && res.status === 401 ) {
        return Promise.reject(err);
        // TODO: RC DISCUSS Handle unauthed epinio calls
        // dispatch('auth/logout', opt.logoutOnError, { root: true });
      }

      if ( typeof res.data !== 'undefined' ) {
        return Promise.reject(responseObject(res));
      }

      return Promise.reject(err);
    });

    function responseObject(res) {
      let out = res.data;

      if (typeof out === 'string') {
        out = {};
      }

      if ( res.status === 204 || out === null || typeof out === 'string') {
        out = {};
      }

      Object.defineProperties(out, {
        _status:     { value: res.status },
        _statusText: { value: res.statusText },
        _headers:    { value: res.headers },
        _req:        { value: res.request },
        _url:        { value: opt.url },
      });

      return out;
    }
  },

  loadSchemas: (ctx) => {
    const { commit, rootGetters } = ctx;
    const res = {
      data: [{
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.APP,
        type:              'schema',
        links:             { collection: 'api/v1/applications' },
        collectionMethods: ['get', 'post'],
        resourceFields:    {}
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.NAMESPACE,
        type:              'schema',
        links:             { collection: '/proxy/api/v1/namespaces' },
        collectionMethods: ['get', 'post'],
      }]
    };

    const spoofedSchemas = rootGetters['type-map/spoofedSchemas'](EPINIO_PRODUCT_NAME);

    res.data = res.data.concat(spoofedSchemas);

    res.data.forEach((schema) => {
      schema._id = normalizeType(schema.id);
      schema._group = normalizeType(schema.attributes?.group);
    });

    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res.data
    });
  }

};
