import { markRaw, Component } from 'vue';
import { MutationTree, GetterTree, ActionTree } from 'vuex';
import type { ModalSize } from '@shell/apis/intf/shell-api/modal';

export interface ModalState {
  isOpen: boolean;
  component: Component | null;
  componentProps: Record<string, any>;
  resources: any[];
  closeOnClickOutside: boolean;
  modalWidth: string;
  modalSticky: boolean;
  title: string;
  size: ModalSize | null;
}

const state = (): ModalState => ({
  isOpen:              false,
  component:           null,
  componentProps:      {},
  resources:           [],
  closeOnClickOutside: false,
  modalWidth:          '600px',
  modalSticky:         false,
  title:               '',
  size:                null
});

const getters: GetterTree<ModalState, any> = {
  isOpen:              (state) => state.isOpen,
  component:           (state) => state.component,
  componentProps:      (state) => state.componentProps,
  resources:           (state) => state.resources,
  closeOnClickOutside: (state) => state.closeOnClickOutside,
  modalWidth:          (state) => state.modalWidth,
  modalSticky:         (state) => state.modalSticky,
  title:               (state) => state.title,
  size:                (state) => state.size,
};

const mutations: MutationTree<ModalState> = {
  openModal(state, payload: {
    component: Component;
    componentProps?: Record<string, any>;
    resources?: any[];
    closeOnClickOutside?: boolean;
    modalWidth?: string;
    modalSticky?: boolean;
    title?: string;
    size?: ModalSize;
  }) {
    state.isOpen = true;
    state.component = markRaw(payload.component);
    state.componentProps = payload.componentProps || {};
    state.resources = Array.isArray(payload.resources) ? payload.resources : (payload.resources ? [payload.resources] : []);
    state.closeOnClickOutside = payload.closeOnClickOutside ?? false;
    state.modalWidth = payload.modalWidth || '600px';
    state.modalSticky = payload.modalSticky ?? false;
    state.title = payload.title || '';
    state.size = payload.size ?? null;
  },

  closeModal(state) {
    state.isOpen = false;
    state.component = null;
    state.componentProps = {};
    state.resources = [];
    state.closeOnClickOutside = false;
    state.modalWidth = '600px';
    state.modalSticky = false;
    state.title = '';
    state.size = null;
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
