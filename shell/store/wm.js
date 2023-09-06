import { addObject, removeObject } from '@shell/utils/array';

export const state = function() {
  return {
    tabs:       [],
    active:     null,
    open:       false,
    userHeight: null,
    userWidth:  null,
    userPin:    null,
  };
};

export const getters = {
  byId: (state) => (id) => {
    return state.tabs.find((x) => x.id === id);
  },
  allTabs: (state) => state.tabs,
};

export const mutations = {
  addTab(state, tab) {
    const existing = state.tabs.find((x) => x.id === tab.id);

    if ( !existing ) {
      addObject(state.tabs, tab);
    }

    state.active = tab.id;
    state.open = true;
  },

  removeTab(state, tab) {
    removeObject(state.tabs, tab);
  },

  setOpen(state, open) {
    state.open = open;
  },

  setActive(state, id) {
    state.active = id;
  },

  setUserHeight(state, height) {
    state.userHeight = height;
  },

  setUserWidth(state, width) {
    state.userWidth = width;
  },

  setUserPin(state, pin) {
    state.userPin = pin;
  }
};

export const actions = {
  close({ state, getters, commit }, id) {
    const tab = getters.byId(id);

    if ( !tab ) {
      return;
    }

    let idx = state.tabs.indexOf(tab);

    commit('removeTab', tab);
    if ( idx >= state.tabs.length ) {
      idx = state.tabs.length - 1;
    }

    if ( idx >= 0 ) {
      commit('setActive', state.tabs[idx].id);
    } else {
      commit('setOpen', false);
    }
  },

  // {
  //   id:  shell-<pod id> -- A string that is be unique for this instance;
  //                           if a window with this key exists it will be focused instead of creating another
  //   label: Shown on the tab
  //   icon:  Shown on the tab
  //   component: 'ContainerShell',
  //   attrs: { whateverTheComponent: wants }
  // }
  open({ commit }, tab) {
    if ( !tab.id ) {
      throw new Error('Window must have an id property');
    }

    commit('addTab', tab);
  }
};
