import { addObject, removeObject } from '@/utils/array';

export const state = function() {
  return {
    tabs:       [],
    active:     null,
    open:       false,
    userHeight: null,
  };
};

export const mutations = {
  addTab(state, tab) {
    addObject(state.tabs, tab);
    state.active = tab;
    state.open = true;
  },

  removeTab(state, tab) {
    removeObject(state.tabs, tab);
  },

  setOpen(state, open) {
    state.open = open;
  },

  setActive(state, tab) {
    state.active = tab;
  },

  setUserHeight(state, height) {
    state.userHeight = height;
  }
};

export const actions = {
  close({ state, commit }, tab) {
    debugger;
    // @TODO close/disconnect things hook...
    let idx = state.tabs.indexOf(tab);

    commit('removeTab', tab);
    if ( idx >= state.tabs.length ) {
      idx = state.tabs.length - 1;
    }

    if ( idx >= 0 ) {
      commit('setActive', state.tabs[idx]);
    } else {
      commit('setOpen', false);
    }
  },

  open({ commit }, tab) {
    commit('addTab', tab);
  }
};
