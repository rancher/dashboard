const defaultState = {
  previewCluster: {
    ready:   true,
    isLocal: false,
    badge:   { }
  }
};

export const state = function() {
  return { previewCluster: defaultState.previewCluster };
};

export const getters = {
  getPreviewCluster(state) {
    return state.previewCluster;
  },
};

export const mutations = {
  setPreviewCluster(state, previewCluster) {
    state.previewCluster = previewCluster;
  },
  setDefaultPreviewCluster(state) {
    state.previewCluster = defaultState.previewCluster;
  }
};

export const actions = {
  setPreviewCluster({ commit }, previewCluster) {
    commit('setPreviewCluster', previewCluster);
  },
  setDefaultPreviewCluster({ commit }) {
    commit('setDefaultPreviewCluster');
  }
};
