export default {
  kubewardenStateChange({ commit }: any, { val }: any) {
    commit('changeState', val);
  }
};
