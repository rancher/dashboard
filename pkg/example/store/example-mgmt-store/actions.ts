import { exampleMgmtStoreMockRequest } from '../mock-data';
import { SCHEMA } from '@shell/config/types';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { EXAMPLE_PRODUCT_NAME, EXAMPLE_TYPES } from '../../types';

export default {

  request(ctx: any, { opt }: any) {
    // This is where custom api requests via $axios should be made

    const data = exampleMgmtStoreMockRequest();

    return responseObject({
      status: 200,
      data
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

  async onLogout({ commit }: any) {
    await commit('reset');
  },

  loadManagement(ctx: any) {
    const { state, commit } = ctx;

    if ( state.managementReady) {
      // Do nothing, it's already loaded
      return;
    }

    // Use this to store non-cluster specific schemas. Cluster specific types are stored in the cluster specific store

    // Load management style schemas
    const res = {
      data: [{
        product:           EXAMPLE_PRODUCT_NAME,
        id:                 EXAMPLE_TYPES.CLUSTER,
        _id:               normalizeType(EXAMPLE_TYPES.CLUSTER),
        type:              'schema',
        links:             { collection: '/api/v1/clusters' },
        collectionMethods: ['get', 'post'],
        resourceFields:    { },
        attributes:        { }
      }]
    };

    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res.data
    });

    commit('managementChanged', { ready: true });
  },

  watch() {
  },

};
