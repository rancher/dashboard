// import { addObject, removeObject } from '@shell/utils/array';

export const state = function() {
  return {
    // tabs:       [],
    userHeight: window.localStorage.getItem('wm2-height') || 'auto',
    userWidth:  window.localStorage.getItem('wm2-width') || '400px',
    open:       false, // window.localStorage.getItem('wm2-open') === 'true',
    config:     {},
  };
};

export const getters = {
  isOpen:    (state) => state.open,
  config:    (state) => state.config,
  userWidth: (state) => state.userWidth,
};

export const mutations = {
  setOpen(state, open) {
    state.open = open;
    // window.localStorage.setItem('wm2-open', open);
  },

  setConfig(state, config) {
    state.config = config;
  },

  // addTab(state, tab) {
  //   const existing = !!state.tabs[0];

  //   if (!existing) {
  //     addObject(state.tabs, tab);
  //   }
  // },

  // removeTab(state, tab) {
  //   removeObject(state.tabs, tab);
  // },

  setUserHeight(state, height) {
    state.userHeight = height;
  },

  setUserWidth(state, width) {
    state.userWidth = width;
    window.localStorage.setItem('wm2-width', width);
  },
};

export const actions = {
  open({ commit }, { config }) {
    commit('setConfig', config);
    commit('setOpen', true);
  },

  close({ commit }) {
    commit('setOpen', false);
  },

  setUserHeight({ commit }, height) {
    commit('setUserHeight', height);
  },

  setUserWidth({ commit }, width) {
    commit('setUserWidth', width);
  },
};
