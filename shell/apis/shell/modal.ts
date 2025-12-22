import { Component } from 'vue';
import { ModalApi, ModalConfig } from '@shell/apis/intf/shell';
import { Store } from 'vuex';

export class ModalApiImpl implements ModalApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  /**
   * Opens a modal by committing to the Vuex store.
   *
   * Example:
   * ```ts
   * import MyCustomModal from '@/components/MyCustomModal.vue';
   *
   * this.$shell.modal.open(MyCustomModal, {
   *   props: { title: 'Hello Modal' }
   * });
   * ```
   *
   * @param component
   * The Vue component to be displayed inside the modal.
   * This can be any SFC (Single-File Component) imported and passed in as a `Component`.
   *
   * @param config Configuration object for opening a modal.
   *
   */
  public open(component: Component, config?: ModalConfig): void {
    this.store.commit('modal/openModal', {
      component,
      componentProps:      config?.props || {},
      resources:           config?.resources || [],
      modalWidth:          config?.width || '600px',
      closeOnClickOutside: config?.closeOnClickOutside ?? true,
      // modalSticky:         config.modalSticky ?? false // Not implemented yet
    });
  }
}
