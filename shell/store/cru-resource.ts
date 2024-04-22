interface State {
  createNamespace: boolean;
}

export const state = (): State => {
  return { createNamespace: false };
};

export const mutations = {
  SET_CREATE_NAMESPACE(state: State, shouldCreateNamespace: boolean): void {
    state.createNamespace = shouldCreateNamespace;
  }
};

export const actions = {
  setCreateNamespace({ commit }: unknown, shouldCreateNamespace: boolean): void {
    commit('SET_CREATE_NAMESPACE', shouldCreateNamespace);
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
