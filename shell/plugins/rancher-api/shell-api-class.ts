import { Store } from 'vuex';

import { GrowlConfig } from '@shell/types/rancher-api/growl';
import { ModalConfig } from '@shell/types/rancher-api/modal';

interface ShellApiOptions {
  store: Store<any>;
}

export default class ShellApi {
  protected $store: Store<any>;

  constructor(options: ShellApiOptions) {
    this.$store = options.store;
  }

  /**
   * Dispatches a growl notification.
   *
   * @param config - Configuration for the growl notification.
   * - If `message` is a string, it is treated as the main content of the notification.
   * - If `message` is a `DetailedMessage` object, `title` and `description` are extracted.
   *
   * Example:
   * ```
   * this.$shell.growl({ message: 'Operation successful!', type: 'success' });
   * this.$shell.growl({ message: { title: 'Warning', description: 'Check your input.' }, type: 'warning' });
   * ```
   */
  growl(config: GrowlConfig): void {
    const { type = 'error', timeout = 5000 } = config;

    let title = '';
    let description = '';

    if (typeof config.message === 'string') {
      description = config.message;
    } else {
      title = config.message.title || '';
      description = config.message.description;
    }

    this.$store.dispatch(
      `growl/${ type }`,
      {
        title,
        message: description,
        timeout,
      },
      { root: true }
    );
  }

  /**
   * Opens a modal by committing to the Vuex store.
   *
   * This method updates the store's `action-menu` module to show a modal with the
   * specified configuration. The modal is rendered using the `PromptModal` component,
   * and its content is dynamically loaded based on the `component` field in the configuration.
   *
   * @param config A `ModalConfig` object defining the modal’s content and behavior.
   *
   * Example:
   * ```
   * this.$shell.modal({
   *   component: 'MyCustomDialog',
   *   componentProps: { title: 'Hello Modal' },
   *   resources: [someResource],
   *   modalWidth: '800px',
   *   closeOnClickOutside: false
   * });
   * ```
   */
  modal(config: ModalConfig): void {
    this.$store.commit('action-menu/togglePromptModal', {
      component:           config.component,
      componentProps:      config.componentProps || {},
      resources:           config.resources || [],
      modalWidth:          config.modalWidth || '600px',
      closeOnClickOutside: config.closeOnClickOutside ?? true,
    });
  }
}
