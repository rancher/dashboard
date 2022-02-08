import { SCHEMA } from '@/config/types';
import { EPINIO_MGMT_STORE, EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/products/epinio/types';
import { normalizeType } from '@/plugins/core-store/normalize';
import { handleSpoofedRequest } from '@/plugins/core-store/actions';
import { base64Encode } from '@/utils/crypto';
import { NAMESPACE_FILTERS } from '@/store/prefs';
import { createNamespaceFilterKeyWithId } from '@/utils/namespace-filter';
import { parse as parseUrl, stringify as unParseUrl } from '@/utils/url';

const createId = (schema, resource) => {
  const name = resource.meta?.name || resource.name;
  const namespace = resource.meta?.namespace || resource.namespace;

  if (schema?.attributes?.namespaced && namespace) {
    return `${ namespace }/${ name }`;
  }

  return name;
};

const epiniofy = (obj, schema, type) => ({
  ...obj,
  // Note - these must be applied here ... so things that need an id before classifying have access to them
  id: createId(schema, obj),
  type,
});

const standalone = true; // TODO: RC conditional on isSingleProduct

export default {

  remove({ commit }, obj ) {
    commit('remove', obj);
  },

  async request({ rootGetters, dispatch, getters }, {
    opt, type, clusterId, growlOnError = true
  }) {
    const spoofedRes = await handleSpoofedRequest(rootGetters, EPINIO_PRODUCT_NAME, opt);

    if (spoofedRes) {
      return spoofedRes;
    }

    // @TODO queue/defer duplicate requests
    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

    // TODO: RC tidy, conditional on isSingleProduct
    if (standalone) {
      const prependPath = `/pp/v1/proxy`;
      const url = parseUrl(opt.url);

      if (!url.path.startsWith(prependPath)) {
        url.path = prependPath + url.path;
        // console.warn(opt.url, ' vs ', url, unParseUrl(url));
        opt.url = unParseUrl(url);
      }
      opt.headers = {
        ...opt.headers,
        'x-cap-cnsi-list':   'rAgj2mNgfUEHq6N90b86azw8gbs', // hash of url!!
        'x-cap-passthrough': true,
      };
    }

    return await dispatch(`${ EPINIO_MGMT_STORE }/findAll`, { type: EPINIO_TYPES.INSTANCE }, { root: true })
      .then(() => {
        if (standalone) {
          // TODO: RC remove?
          opt.headers = {
            ...opt.headers,
            user_id: `1234`
          };
        } else {
          const currentClusterId = clusterId || rootGetters['clusterId'];
          const currentCluster = rootGetters[`${ EPINIO_MGMT_STORE }/byId`](EPINIO_TYPES.INSTANCE, currentClusterId);

          opt.headers = {
            ...opt.headers,
            Authorization: `Basic ${ base64Encode(`${ currentCluster.username }:${ currentCluster.password }`) }`
          };

          opt.url = `${ currentCluster.api }${ opt.url }`;
        }

        return this.$axios(opt);
      })
      .then((res) => {
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
          const schema = getters.schemaFor(type);

          if (Array.isArray(out)) {
            res.data = { data: out.map(o => epiniofy(o, schema, type)) };
          } else {
            // `find` action turns this into `{data: out}`
            res.data = epiniofy(out, schema, type);
          }

          return responseObject(res);
        }
      }).catch((err) => {
        if (growlOnError) {
          dispatch('growl/fromError', { title: `Epinio Request to ${ opt.url }`, err }, { root: true });
        }

        if ( !err || !err.response ) {
          return Promise.reject(err);
        }

        const res = err.response;

        // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
        if ( opt.redirectUnauthorized !== false && process.client && res.status === 401 ) {
          return Promise.reject(err);
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

  loadManagement(ctx) {
    const { dispatch } = ctx;

    dispatch(`${ EPINIO_MGMT_STORE }/loadManagement`, null, { root: true });
  },

  onLogout({ dispatch, commit }) {
    console.warn('2!!!!!');
    dispatch(`unsubscribe`);
    commit('reset');

    dispatch(`${ EPINIO_MGMT_STORE }/onLogout`, null, { root: true });
  },

  loadSchemas: ( ctx ) => {
    const { commit, rootGetters } = ctx;

    const res = {
      data: [{
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.APP,
        type:              'schema',
        links:             { collection: '/api/v1/applications' },
        collectionMethods: ['get', 'post'],
        resourceFields:    { },
        attributes:        { namespaced: true }
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.NAMESPACE,
        type:              'schema',
        links:             { collection: '/api/v1/namespaces' },
        collectionMethods: ['get', 'post'],
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.SERVICE,
        type:              'schema',
        links:             { collection: '/api/v1/services' },
        collectionMethods: ['get', 'post'],
        resourceFields:    { },
        attributes:        { namespaced: true }
      }]
    };

    const spoofedSchemas = rootGetters['type-map/spoofedSchemas'](EPINIO_PRODUCT_NAME);
    const excludeInstances = spoofedSchemas.filter(schema => schema.id !== EPINIO_TYPES.INSTANCE);

    res.data = res.data.concat(excludeInstances);

    res.data.forEach((schema) => {
      schema._id = normalizeType(schema.id);
      schema._group = normalizeType(schema.attributes?.group);
    });

    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res.data
    });
  },

  loadCluster: async( { dispatch, commit, rootGetters }, { id } ) => {
    await dispatch(`findAll`, { type: EPINIO_TYPES.NAMESPACE });
    await dispatch('cleanNamespaces', null, { root: true });

    const key = createNamespaceFilterKeyWithId(id, EPINIO_PRODUCT_NAME);
    const filters = rootGetters['prefs/get'](NAMESPACE_FILTERS)?.[key] || [];

    commit('updateNamespaces', { filters }, { root: true });
  },

};
