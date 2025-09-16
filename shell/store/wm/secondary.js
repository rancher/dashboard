export const state = function() {
  return { open: false };
};

export const getters = { isOpen: (state) => state.open };

export const mutations = {
  setOpen(state, open) {
    state.open = open;
  },
};

export const actions = {
  close({ commit }) {
    commit('setOpen', false);
  },

  open({ commit }) {
    commit('setOpen', true);
  },
};
