import { SCHEMA } from '@/config/types';
import { handleSpoofedRequest } from '@/plugins/core-store/actions';
import { normalizeType } from '@/plugins/core-store/normalize';
import { EPINIO_MGMT_STORE, EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/products/epinio/types';

export default {

  async request({ rootGetters }, { opt }) {
    const spoofedRes = await handleSpoofedRequest(rootGetters, EPINIO_MGMT_STORE, opt);

    if (spoofedRes) {
      return spoofedRes;
    }

    throw new Error('Not Implemented');
  },

  onLogout({ commit }) {
    commit('managementChanged', { ready: false });
    commit('reset');
  },

  loadManagement(ctx) {
    const { state, commit, rootGetters } = ctx;

    // Use this to store non-cluster specific schemas. Cluster specific types are stored in epinio and are remove on cluster change

    if ( state.managementReady) {
      // Do nothing, it's already loaded
      return;
    }

    // Load management style schemas
    const spoofedSchemas = rootGetters['type-map/spoofedSchemas'](EPINIO_PRODUCT_NAME);
    const instances = spoofedSchemas.find(schema => schema.id === EPINIO_TYPES.INSTANCE);

    const res = { data: [instances] };

    res.data.forEach((schema) => {
      schema._id = normalizeType(schema.id);
      schema._group = normalizeType(schema.attributes?.group);
    });

    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res.data
    });

    // dispatch('loadSchemas')
    commit('managementChanged', { ready: true });
  },

  watch() {
  }
};
