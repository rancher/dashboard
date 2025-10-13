import { Component } from 'vue';
import { ModalApi, ModalApiConfig } from '@shell/apis/intf/shell';
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
     * this.$shell.modal.show(MyCustomModal, {
     *   componentProps: { title: 'Hello Modal' }
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
  public open(component: Component, config?: ModalApiConfig): void {
    this.store.commit('modal/openModal', {
      component,
      componentProps:      config?.componentProps || {},
      resources:           config?.resources || [],
      modalWidth:          config?.modalWidth || '600px',
      closeOnClickOutside: config?.closeOnClickOutside ?? true,
      // modalSticky:         config.modalSticky ?? false // Not implemented yet
    });
  }
}
