import { SCHEMA } from '@shell/config/types';
import { EPINIO_MGMT_STORE, EPINIO_PRODUCT_NAME, EPINIO_STANDALONE_CLUSTER_NAME, EPINIO_TYPES } from '../../types';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { handleSpoofedRequest } from '@shell/plugins/dashboard-store/actions';
import { base64Encode } from '@shell/utils/crypto';
import { NAMESPACE_FILTERS } from '@shell/store/prefs';
import { createNamespaceFilterKeyWithId } from '@shell/utils/namespace-filter';
import { parse as parseUrl, stringify as unParseUrl } from '@shell/utils/url';
import { classify } from '@shell/plugins/dashboard-store/classify';

const createId = (schema: any, resource: any) => {
  const name = resource.meta?.name || resource.name;
  const namespace = resource.meta?.namespace || resource.namespace;

  if (schema?.attributes?.namespaced && namespace) {
    return `${ namespace }/${ name }`;
  }

  return name;
};

const epiniofy = (obj: any, schema: any, type: any) => ({
  ...obj,
  // Note - these must be applied here ... so things that need an id before classifying have access to them
  id: createId(schema, obj),
  type,
});

export default {

  remove({ commit }: any, obj: any ) {
    commit('remove', obj);
  },

  async request({ rootGetters, dispatch, getters }: any, {
    opt, type, clusterId, growlOnError = false
  }: any) {
    const spoofedRes = await handleSpoofedRequest(rootGetters, EPINIO_PRODUCT_NAME, opt, EPINIO_PRODUCT_NAME);

    if (spoofedRes) {
      return spoofedRes;
    }

    // @TODO queue/defer duplicate requests
    opt.depaginate = opt.depaginate !== false;
    opt.url = opt.url.replace(/\/*$/g, '');

    const isSingleProduct = rootGetters['isSingleProduct'];

    let ps = Promise.resolve(opt?.prependPath);

    if (isSingleProduct) {
      if (opt?.prependPath === undefined) {
        ps = dispatch('findSingleProductCNSI').then((cnsi: any) => `/pp/v1/direct/r/${ cnsi?.guid }`);
      }
    } else {
      ps = dispatch(`${ EPINIO_MGMT_STORE }/findAll`, { type: EPINIO_TYPES.INSTANCE }, { root: true }).then(() => '');
    }

    // opt.httpsAgent = new https.Agent({ rejectUnauthorized: false });

    return await ps
      .then((prependPath = opt?.prependPath) => {
        if (isSingleProduct) {
          if (opt.url.startsWith('/')) {
            opt.url = prependPath + opt.url;
          } else {
            const url = parseUrl(opt.url);

            if (!url.path.startsWith(prependPath)) {
              url.path = prependPath + url.path;
              opt.url = unParseUrl(url);
            }
          }
        } else {
          const currentClusterId = clusterId || rootGetters['clusterId'];
          const currentCluster = rootGetters[`${ EPINIO_MGMT_STORE }/byId`](EPINIO_TYPES.INSTANCE, currentClusterId);

          opt.headers = {
            ...opt.headers,
            Authorization: `Basic ${ base64Encode(`${ currentCluster.username }:${ currentCluster.password }`) }`
          };

          opt.url = `${ currentCluster.api }${ opt.url }`;
        }

        return (this as any).$axios(opt);
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
        if ( !err || !err.response ) {
          return Promise.reject(err);
        }

        const res = err.response;

        // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
        if ( opt.redirectUnauthorized !== false && (process as any).client && res.status === 401 ) {
          // return Promise.reject(err);
          dispatch('auth/logout', opt.logoutOnError, { root: true });
        } else if (growlOnError) {
          dispatch('growl/fromError', { title: `Epinio Request to ${ opt.url }`, err }, { root: true });
        }

        if ( typeof res.data !== 'undefined' ) {
          return Promise.reject(responseObject(res));
        }

        return Promise.reject(err);
      });

    function responseObject(res: any) {
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

  async onLogout({ dispatch, commit }: any) {
    await dispatch(`unsubscribe`);
    await commit('reset');
  },

  loadSchemas: ( ctx: any ) => {
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
        id:                EPINIO_TYPES.APP_CHARTS,
        type:              'schema',
        links:             { collection: '/api/v1/appcharts' },
        collectionMethods: ['get'],
        resourceFields:    { },
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.NAMESPACE,
        type:              'schema',
        links:             { collection: '/api/v1/namespaces' },
        collectionMethods: ['get', 'post'],
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.CATALOG_SERVICE,
        type:              'schema',
        links:             { collection: '/api/v1/catalogservices' },
        collectionMethods: ['get', 'post'],
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.SERVICE_INSTANCE,
        type:              'schema',
        links:             { collection: '/api/v1/services' },
        collectionMethods: ['get', 'post'],
        attributes:        { namespaced: true }
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.APP_INSTANCE,
        type:              'schema',
        links:             { collection: '/api/v1/na' },
        collectionMethods: ['get'],
      }, {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.CONFIGURATION,
        type:              'schema',
        links:             { collection: '/api/v1/configurations' },
        collectionMethods: ['get', 'post'],
        resourceFields:    { },
        attributes:        { namespaced: true }
      }]
    };

    const spoofedSchemas = rootGetters['type-map/spoofedSchemas'](EPINIO_PRODUCT_NAME);
    const excludeInstances = spoofedSchemas.filter((schema: any) => schema.id !== EPINIO_TYPES.INSTANCE);

    res.data = res.data.concat(excludeInstances);

    res.data.forEach((schema: any) => {
      schema._id = normalizeType(schema.id);
      schema._group = normalizeType(schema.attributes?.group);
    });

    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res.data
    });
  },

  loadCluster: async( { dispatch, commit, rootGetters }: any, { id }: any ) => {
    await dispatch(`findAll`, { type: EPINIO_TYPES.NAMESPACE });
    dispatch(`findAll`, { type: EPINIO_TYPES.APP }); // This is used often, get a kick start
    await dispatch('cleanNamespaces', null, { root: true });

    const key = createNamespaceFilterKeyWithId(id, EPINIO_PRODUCT_NAME);
    const filters = rootGetters['prefs/get'](NAMESPACE_FILTERS)?.[key] || [];

    commit('updateNamespaces', { filters }, { root: true });
  },

  findSingleProductCNSI: async( { dispatch, commit, getters }: any ) => {
    const singleProductCNSI = getters['singleProductCNSI']();

    if (singleProductCNSI) {
      return singleProductCNSI;
    }

    const { data: endpoints } = await dispatch('request', {
      opt: {
        url:         '/endpoints',
        prependPath: '/pp/v1'
      }
    });
    const cnsi = endpoints?.find((e: any) => e.name === EPINIO_STANDALONE_CLUSTER_NAME);

    if (!cnsi) {
      console.warn('Unable to find the CNSI guid of the Epinio Endpoint');// eslint-disable-line no-console
    }

    commit('singleProductCNSI', cnsi);

    return cnsi;
  },

  createNamespace(ctx: any, obj: { name : string }) {
    // Note - created model save --> create
    return classify(ctx, {
      type: EPINIO_TYPES.NAMESPACE,
      meta: { name: obj.name }
    });
  }
};
