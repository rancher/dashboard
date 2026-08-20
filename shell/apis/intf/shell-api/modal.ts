import { Component } from 'vue';

/**
 * The three modal widths of the design system.
 */
export type ModalSize = 'small' | 'medium' | 'large';

/**
 * Configuration object for opening a modal.
 */
export interface ModalConfig {
  /**
   * The modal title.
   *
   * Supplying `title` or `size` opts the modal into `RcModal`, the standard
   * modal of the Rancher design system: it supplies the heading, the padding,
   * one of three standard widths, and names the dialog for assistive
   * technology. Your component renders as the modal body.
   *
   * Without either, the modal keeps the older frameless behaviour and your
   * component is responsible for its own heading and padding.
   *
   * Your component supplies the body only. This API cannot reach `RcModal`'s
   * actions slot, so render your buttons inside your own component, or import
   * `RcModal` from `@rancher/components` and render it yourself when you want
   * the standard footer row.
   *
   * Example:
   * ```ts
   * shell.modal.open(MyCustomModal, { title: 'Delete namespace?', size: 'small' });
   * ```
   */
  title?: string;

  /**
   * The modal width, as one of the three standard sizes: `small` (480px),
   * `medium` (640px) or `large` (960px). Prefer this over `width`.
   *
   * Example:
   * ```ts
   * size: 'small'
   * ```
   */
  size?: ModalSize;

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
   * import { useShell } from '@shell/apis';
   * import MyCustomModal from './MyCustomModal.vue';
   *
   * const shell = useShell();
   *
   * function myAction() {
   *   console.log('Performed an action');
   * }
   *
   * function showModal() {
   *   shell.modal.open(MyCustomModal, {
   *     props: { onConfirm: myAction }
   *   });
   * }
   * ```
   *
   * ```ts
   * const props = defineProps<{ onConfirm: () => void }>();
   * const emit = defineEmits<{ close: [] }>();
   *
   * function confirm() {
   *   props.onConfirm();
   *   emit('close');
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
   *
   * @deprecated Use `size` instead, so the modal is one of the three widths the
   * design system defines. `width` is ignored when `size` or `title` is given.
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
   * import { useShell } from '@shell/apis';
   * import MyCustomModal from '@/components/MyCustomModal.vue';
   *
   * const shell = useShell();
   *
   * shell.modal.open(MyCustomModal, {
   *   props: { title: 'Hello Modal' }
   * });
   * ```
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
