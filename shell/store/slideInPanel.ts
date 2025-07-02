import { markRaw, Component } from 'vue';
import { MutationTree, GetterTree, ActionTree } from 'vuex';

export interface SlideInPanelState {
  isOpen: boolean;
  isClosing: boolean;
  component: Component | null;
  componentProps: Record<string, any>;
}

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
    state.isOpen = true;
    state.component = markRaw(payload.component);
    state.componentProps = payload.componentProps || {};
  },
  close(state) {
    state.isClosing = true;
    state.isOpen = false;

    // Delay clearing component/props for 500ms (same as transition duration)
    setTimeout(() => {
      state.component = null;
      state.componentProps = {};

      state.isClosing = false;
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
