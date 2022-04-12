import { SCHEMA } from '@shell/config/types';
import { handleSpoofedRequest } from '@shell/plugins/core-store/actions';
import { normalizeType } from '@shell/plugins/core-store/normalize';
import { EPINIO_MGMT_STORE, EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '../../types';

export default {

  async request({ rootGetters }: any, { opt }: any) {
    const spoofedRes = await handleSpoofedRequest(rootGetters, EPINIO_MGMT_STORE, opt, EPINIO_PRODUCT_NAME);

    if (spoofedRes) {
      return spoofedRes;
    }

    throw new Error('Not Implemented');
  },

  onLogout({ commit }: any) {
    commit('managementChanged', { ready: false });
    commit('reset');
  },

  loadManagement(ctx: any) {
    const { state, commit, rootGetters } = ctx;

    // Use this to store non-cluster specific schemas. Cluster specific types are stored in epinio and are remove on cluster change

    if ( state.managementReady) {
      // Do nothing, it's already loaded
      return;
    }

    // Load management style schemas
    const spoofedSchemas = rootGetters['type-map/spoofedSchemas'](EPINIO_PRODUCT_NAME);
    const instances = spoofedSchemas.find((schema: any) => schema.id === EPINIO_TYPES.INSTANCE);

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
