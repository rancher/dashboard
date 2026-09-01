import { markRaw, Component } from 'vue';
import { MutationTree, GetterTree, ActionTree } from 'vuex';

export interface ModalState {
  isOpen: boolean;
  component: Component | null;
  componentProps: Record<string, any>;
  resources: any[];
  closeOnClickOutside: boolean;
  modalWidth: string;
  modalSticky: boolean;
}

const state = (): ModalState => ({
  isOpen:              false,
  component:           null,
  componentProps:      {},
  resources:           [],
  closeOnClickOutside: false,
  modalWidth:          '600px',
  modalSticky:         false
});

const getters: GetterTree<ModalState, any> = {
  isOpen:              (state) => state.isOpen,
  component:           (state) => state.component,
  componentProps:      (state) => state.componentProps,
  resources:           (state) => state.resources,
  closeOnClickOutside: (state) => state.closeOnClickOutside,
  modalWidth:          (state) => state.modalWidth,
  modalSticky:         (state) => state.modalSticky,
};

const mutations: MutationTree<ModalState> = {
  openModal(state, payload: {
    component: Component;
    componentProps?: Record<string, any>;
    resources?: any[];
    closeOnClickOutside?: boolean;
    modalWidth?: string;
    modalSticky?: boolean;
  }) {
    state.isOpen = true;
    state.component = markRaw(payload.component);
    state.componentProps = payload.componentProps || {};
    state.resources = Array.isArray(payload.resources) ? payload.resources : (payload.resources ? [payload.resources] : []);
    state.closeOnClickOutside = payload.closeOnClickOutside ?? false;
    state.modalWidth = payload.modalWidth || '600px';
    state.modalSticky = payload.modalSticky ?? false;
  },

  closeModal(state) {
    state.isOpen = false;
    state.component = null;
    state.componentProps = {};
    state.resources = [];
    state.closeOnClickOutside = false;
    state.modalWidth = '600px';
    state.modalSticky = false;
  }
};

const actions: ActionTree<ModalState, any> = {};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
