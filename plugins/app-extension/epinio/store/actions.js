import https from 'https';

import { SCHEMA } from '@/config/types';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/plugins/app-extension/epinio/types';
import { normalizeType } from '@/plugins/core-store/normalize';
import { handleSpoofedRequest } from '@/plugins/core-store/actions';

export default {
  async request({ rootGetters }, { opt, type }) {
    const spoofedRes = await handleSpoofedRequest(rootGetters, EPINIO_PRODUCT_NAME, opt);

    if (spoofedRes) {
      return spoofedRes;
    }

    // @TODO queue/defer duplicate requests
    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    opt.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    opt.headers = {
      'x-api-host':    'https://epinio.172.27.0.2.omg.howdoi.website', // TODO: RC FIX fetch from cluster
      Authorization: 'Basic <snip>' // TODO: RC AUTH fetch from cluster
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

      if ( res.status === 204 || out === null ) {
        out = {};
      }

      // TODO: API - orgs call returns array of strings!
      if (Array.isArray(out)) {
        out = {
          data: out.map((o) => {
            if (typeof o === 'string') {
              return { id: o, type };
            }

            return {
              ...o,
              id: o.name,
              type // TODO: RC get from url
            };
          })
        };
      } else {
        // `find` action turns this into `{data: out}`
        out = {
          ...out,
          id: out.name,
          type
        };
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
        id:                EPINIO_TYPES.INSTANCE,
        type:              'schema',
        collectionMethods: ['post'],
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.APP,
        type:              'schema',
        // TODO: RC API v1/apps available?
        links:             { collection: 'api/v1/orgs/workspace/applications' },
        collectionMethods: ['get', 'post'],
        resourceFields:    {}
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.ORG,
        type:              'schema',
        links:             { collection: 'api/v1/orgs' },
        collectionMethods: ['get'],
      }]
    };

    const spoofedTypes = rootGetters['type-map/allSpoofedSchemas'].filter(st => st.product === EPINIO_PRODUCT_NAME);

    res.data = res.data.concat(spoofedTypes);

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
