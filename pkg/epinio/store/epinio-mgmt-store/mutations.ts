export default {
  managementChanged(state: any, { ready }: any) {
    state.managementReady = ready;
  },

};
