import { Position } from '@shell/components/nav/WindowManager/index.vue';
import { addObject, removeObject } from '@shell/utils/array';
import { BOTTOM } from '@shell/utils/position';

export interface State {
  tabs: Array<any>;
  active: Record<Position | string, string>;
  open: Record<Position | string, boolean>;
  panelHeight: Record<Position | string, number | null>;
  panelWidth: Record<Position | string, number | null>;
  userPin: Position | string | null;
}

export const state = function() {
  return {
    tabs:        [],
    active:      {},
    open:        {},
    panelHeight: {},
    panelWidth:  {},
    userPin:     null,
  };
};

function moveTabByReference(tabs: any[], fromPosition: string, toPosition: string, tabId: string) {
  const idx = tabs.findIndex((t) => t.id === tabId && t.position === fromPosition);

  if (idx === -1) return;
  const [tab] = tabs.splice(idx, 1);

  tab.position = toPosition;
  tabs.push(tab);
}

export const getters = {
  byId: (state: State) => (id: string) => {
    return state.tabs.find((x) => x.id === id);
  },
  tabs:        (state: State) => state.tabs,
  isOpen:      (state: State) => (position: string) => state.open[position],
  panelWidth:  (state: State) => state.panelWidth,
  panelHeight: (state: State) => state.panelHeight,
  userPin:     (state: State) => state.userPin,
};

export const mutations = {
  addTab(state: State, tab: any) {
    const existing = state.tabs.find((x) => x.id === tab.id);

    if (!existing) {
      if (tab.position === undefined) {
        tab.position = window.localStorage.getItem('wm-pin') || BOTTOM;
      }

      if (tab.layouts === undefined) {
        tab.layouts = ['default'];
      }

      addObject(state.tabs, tab);
    }

    state.active[tab.position] = tab.id;
    state.open = { ...state.open, [tab.position]: true };
  },

  switchTab(state: State, { tabId, targetPosition }: { tabId: string, targetPosition: Position | string }) {
    const current = { ...(state.tabs.find((x) => x.id === tabId) || {}) };

    if (current) {
      moveTabByReference(state.tabs, current.position, targetPosition, tabId);

      state.active[targetPosition] = tabId;
      state.open = { ...state.open, [targetPosition]: true };

      if (current.position !== targetPosition) {
        const oldPositionTabs = state.tabs.filter((t) => t.position === current.position);

        state.active[current.position] = oldPositionTabs[0]?.id || null;
        state.open[current.position] = oldPositionTabs.length > 0;
      }
    }
  },

  closeTab(state: State, { id }: { id: string }) {
    const tab = state.tabs.find((x) => x.id === id);

    if ( !tab ) {
      return;
    }

    let idx = state.tabs.indexOf(tab);

    removeObject(state.tabs, tab);
    if ( idx >= state.tabs.length ) {
      idx = state.tabs.length - 1;
    }

    if ( idx >= 0 ) {
      state.active[tab.position] = state.tabs[idx].id;
    } else {
      state.open[tab.position] = false;
    }

    const oldPositionTabs = state.tabs.filter((t) => t.position === tab.position);

    state.active[tab.position] = oldPositionTabs[0]?.id || null;
    state.open[tab.position] = oldPositionTabs.length > 0;
  },

  removeTab(state: State, tab: any) {
    removeObject(state.tabs, tab);
  },

  setOpen(state: State, { position, open }: { position: string, open: boolean }) {
    state.open = { ...state.open, [position]: open };
  },

  setActive(state: State, { position, id }: { position: string, id: string }) {
    state.active[position] = id;
  },

  setPanelHeight(state: State, { position, height }: { position: string, height: number | null }) {
    state.panelHeight[position] = height;
    for (const tab of state.tabs) {
      if (tab.position === position) {
        tab.containerHeight = height;
      }
    }
  },

  setPanelWidth(state: State, { position, width }: { position: string, width: number | null }) {
    state.panelWidth[position] = width;
    for (const tab of state.tabs) {
      if (tab.position === position) {
        tab.containerWidth = width;
      }
    }
  },

  setUserPin(state: State, pin: string | null) {
    state.userPin = pin;
  }
};

export const actions = {
  close({ commit }: { state: State, getters: any, commit: any }, id: string) {
    if ( !id ) {
      throw new Error('[wm] id is not provided');
    }
    commit('closeTab', { id });
  },

  open({ commit }: { commit: any }, tab: any) {
    if ( !tab.id ) {
      throw new Error('[wm] id is not provided');
    }

    commit('addTab', tab);
  }
};
