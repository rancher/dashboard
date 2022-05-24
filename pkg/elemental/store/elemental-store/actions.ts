// import { handleSpoofedRequest } from '@shell/plugins/dashboard-store/actions';
// import { ELEMENTAL_STORE, ELEMENTAL_PRODUCT_NAME } from '../../types';

export default {

  // async request({ rootGetters }: any, { opt }: any) {
  //   const spoofedRes = await handleSpoofedRequest(rootGetters, ELEMENTAL_STORE, opt, ELEMENTAL_PRODUCT_NAME);

  //   if (spoofedRes) {
  //     return spoofedRes;
  //   }

  //   throw new Error('Not Implemented');
  // },

  elementalStateChange({ commit }: any, { val }: any) {
    commit('someElementalStateChanged', val);
  }
};
