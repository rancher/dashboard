import { Store } from 'vuex';

import { GrowlConfig } from '@shell/types/rancher-api/growl';
import { ModalConfig } from '@shell/types/rancher-api/modal';
import { SlideInConfig } from '@shell/types/rancher-api/slideIn';

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
   * ```ts
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
   * This method updates the store's `modal` module to show a modal with the
   * specified configuration. The modal is rendered using the `ModalManager` component,
   * and its content is dynamically loaded based on the `component` field in the configuration.
   *
   * @param config A `ModalConfig` object defining the modal’s content and behavior.
   *
   * Example:
   * ```ts
   * this.$shell.modal({
   *   component: MyCustomModal,
   *   componentProps: { title: 'Hello Modal' },
   *   resources: [someResource],
   *   modalWidth: '800px',
   *   closeOnClickOutside: false
   * });
   * ```
   */
  modal(config: ModalConfig): void {
    this.$store.commit('modal/openModal', {
      component:           config.component,
      componentProps:      config.componentProps || {},
      resources:           config.resources || [],
      modalWidth:          config.modalWidth || '600px',
      closeOnClickOutside: config.closeOnClickOutside ?? true,
      // modalSticky:         config.modalSticky ?? false // Not implemented yet
    });
  }

  /**
   * Opens the slide-in panel with the specified component and props.
   *
   * This method commits the `open` mutation to the `slideInPanel` Vuex module,
   * which sets the current component to be rendered and its associated props.
   * The slide-in panel becomes visible after the mutation.
   *
   * @param config - The configuration object for the slide-in panel.
   *
   * Example Usage:
   * ```ts
   * import MyComponent from '@/components/MyComponent.vue';
   *
   * this.$shell.slideInPanel({
   *   component: MyComponent,
   *   componentProps: { foo: 'bar' }
   * });
   * ```
   *
   * @param config.component - A Vue component (imported SFC, functional component, etc.) to be rendered in the panel.
   * @param config.componentProps - (Optional) Props to pass to the component. These should align with the component's defined props.
   */
  slideInPanel(config: SlideInConfig): void {
    this.$store.commit('slideInPanel/open', {
      component:      config.component,
      componentProps: config.componentProps || {}
    });
  }
}
