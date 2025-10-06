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
     * This method updates the store's `modal` module to show a modal with the
     * specified configuration. The modal is rendered using the `ModalManager` component,
     * and its content is dynamically loaded based on the `component` field in the configuration.
     *
     * @param config A `ModalConfig` object defining the modal’s content and behavior.
     *
     * Example:
     * ```ts
     * this.$shell.modal.oepn({
     *   component: MyCustomModal,
     *   componentProps: { title: 'Hello Modal' },
     *   resources: [someResource],
     *   modalWidth: '800px',
     *   closeOnClickOutside: false
     * });
     * ```
     */
  public open(config: ModalConfig): void {
    // this.store.dispatch('management/promptModal', {
    //   component:      'SloDialog',
    //   componentProps: { authProvider: true },
    //   modalWidth:     '600px'
    // });

    this.store.commit('modal/openModal', {
      component:           config.component,
      componentProps:      config.componentProps || {},
      resources:           config.resources || [],
      modalWidth:          config.modalWidth || '600px',
      closeOnClickOutside: config.closeOnClickOutside ?? true,
      // modalSticky:         config.modalSticky ?? false // Not implemented yet
    });
  }
}
