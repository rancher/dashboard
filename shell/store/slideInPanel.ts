import { markRaw, Component } from 'vue';
import { MutationTree, GetterTree, ActionTree } from 'vuex';

export interface SlideInPanelState {
  isOpen: boolean;
  isClosing: boolean;
  component: Component | null;
  componentProps: Record<string, any>;
}

let closeTimer: ReturnType<typeof setTimeout> | null = null;

const state = (): SlideInPanelState => ({
  isOpen:         false,
  isClosing:      false,
  component:      null,
  componentProps: {}
});

const getters: GetterTree<SlideInPanelState, any> = {
  isOpen:         (state) => state.isOpen,
  isClosing:      (state) => state.isClosing,
  component:      (state) => state.component,
  componentProps: (state) => state.componentProps
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
  },
  close(state) {
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
