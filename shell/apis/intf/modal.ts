import { Component } from 'vue';

/**
 * Configuration object for opening a modal.
 */
export interface ModalConfig {
  /**
   * Props to pass directly to the component rendered inside the modal.
   *
   * Example:
   * ```ts
   * props: { title: 'Hello Modal', isVisible: true }
   * ```
   *
   * Props can include callback functions to be invoked when confirming a modal.
   *
   * Example with a callback function:
   *
   * ```ts
   * import MyCustomModal from './MyCustomModal.vue';
   *
   * export default {
   *   methods: {
   *     myAction() {
   *       console.log('Performed an action');
   *     },
   *     showModal() {
   *       this.$shell.modal.open(MyCustomModal, {
   *         props: { onConfirm: this.myAction }
   *       });
   *     }
   *   }
   * }
   * ```
   *
   * ```ts
   * export default {
   *   props: {
   *     onConfirm: {
   *       type: Function,
   *       required: true
   *     }
   *   },
   *   methods:.
   *     confirm() {
   *       this.onConfirm();
   *       this.$emit('close');
   *     }
   *   }
   * }
   * ```
   */
  props?: Record<string, any>;

  /**
   * Array of resources that the modal component might need.
   * These are passed directly into the modal's `resources` prop.
   *
   * Example:
   * ```ts
   * resources: [myResource, anotherResource]
   * ```
   */
  resources?: any[];

  /**
   * Custom width for the modal. Defaults to `600px`.
   * The width can be specified as a string with a valid unit (`px`, `%`, `rem`, etc.).
   *
   * Examples:
   * ```ts
   * width: '800px' // Width in pixels
   * width: '75%'   // Width as a percentage
   * ```
   */
  width?: string;

  /**
   * Determines if clicking outside the modal will close it. Defaults to `true`.
   * Set this to `false` to prevent closing via outside clicks.
   *
   * Example:
   * ```ts
   * closeOnClickOutside: false
   * ```
   */
  closeOnClickOutside?: boolean;

  /**
   * If true, the modal is considered "sticky" and may not close automatically
   * on certain user interactions. Defaults to `false`.
   *
   * Example:
   * ```ts
   * modalSticky: true
   * ```
   */
  // modalSticky?: boolean; // Not implemented yet
}

/**
 * API for displaying modals in Rancher UI. Here's what a Modal looks like in Rancher UI:
 * * ![modal Example](/img/modal.png)
 */
export interface ModalApi {
  /**
   * Opens a modal dialog in Rancher UI
   *
   * Example:
   * ```ts
   * import MyCustomModal from '@/components/MyCustomModal.vue';
   *
   * this.$shell.modal.open(MyCustomModal, {
   *   props: { title: 'Hello Modal' }
   * });
   * ```
   * For usage with the Composition API check usage guide [here](../../shell-api#using-composition-api-in-vue).
   *
   * @param component
   * The Vue component to be displayed inside the modal.
   * This can be any SFC (Single-File Component) imported and passed in as a `Component`.
   *
   *
   * @param config Modal configuration object
   *
   */
  open(component: Component, config?: ModalConfig): void;
}
