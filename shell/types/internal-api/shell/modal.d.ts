import { Component } from 'vue';

/**
 * Configuration object for opening a modal.
 */
export interface ModalConfig {
  /**
   * The Vue component to be displayed inside the modal.
   * This can be any SFC (Single-File Component) imported and passed in as a `Component`.
   *
   * Example:
   * ```ts
   * import MyCustomModal from '@/components/MyCustomModal.vue';
   *
   * this.$shell.modal({
   *   component: MyCustomModal,
   *   props: { title: 'Hello Modal' }
   * });
   * ```
   */
  component: Component;

  /**
   * Optional props to pass directly to the component rendered inside the modal.
   *
   * Example:
   * ```ts
   * props: { title: 'Hello Modal', isVisible: true }
   * ```
   */
  props?: Record<string, any>;

  /**
   * Optional array of resources that the modal component might need.
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
