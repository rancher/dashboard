import { markRaw, Component } from 'vue';
import { MutationTree, GetterTree, ActionTree } from 'vuex';

export interface SlideInPanelState {
  isOpen: boolean;
  isClosing: boolean;
  component: Component | null;
  componentProps: Record<string, any>;
  /**
   * Bumped on every open. The panel component stays mounted for the length of
   * the slide-out, so without this as a `key` a reopen inside that window
   * patches the existing instance instead of remounting it, and any panel that
   * loads its data in a lifecycle hook keeps showing the previous resource.
   */
  openCount: number;
}

let closeTimer: ReturnType<typeof setTimeout> | null = null;

const state = (): SlideInPanelState => ({
  isOpen:         false,
  isClosing:      false,
  component:      null,
  componentProps: {},
  openCount:      0
});

const getters: GetterTree<SlideInPanelState, any> = {
  isOpen:         (state) => state.isOpen,
  isClosing:      (state) => state.isClosing,
  component:      (state) => state.component,
  componentProps: (state) => state.componentProps,
  openCount:      (state) => state.openCount
};

const mutations: MutationTree<SlideInPanelState> = {
  open(state, payload: { component: Component; componentProps?: Record<string, any> }) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    state.isClosing = false;
    state.isOpen = true;
    state.component = markRaw(payload.component);
    state.componentProps = payload.componentProps || {};
    state.openCount++;
  },
  close(state) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    state.isClosing = true;
    state.isOpen = false;

    closeTimer = setTimeout(() => {
      state.component = null;
      state.componentProps = {};
      state.isClosing = false;
      closeTimer = null;
    }, 500);
  }
};

const actions: ActionTree<SlideInPanelState, any> = {};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
