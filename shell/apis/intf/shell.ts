import { Component } from 'vue';

export type GrowlMessage = {
  title: string;

  message?: string;

  // Use enums not strings
  type?: 'success' | 'info' | 'warning' | 'error';

  /**
   * Optional duration (in milliseconds) for which the notification should be displayed.
   * Defaults to `5000` milliseconds. A value of `0` keeps the notification indefinitely.
   */
  timeout?: number;  
}

/**
 * API for displaying growls
 */
export interface GrowlApi {
  /**
   * Shows a growl
   *
   * @param message Message to show in the growl
   */
  show(message: GrowlMessage): void;
}

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
   *   componentProps: { title: 'Hello Modal' }
   * });
   * ```
   */
  component: Component;

  /**
   * Optional props to pass directly to the component rendered inside the modal.
   *
   * Example:
   * ```ts
   * componentProps: { title: 'Hello Modal', isVisible: true }
   * ```
   */
  componentProps?: Record<string, any>;

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
   * modalWidth: '800px' // Width in pixels
   * modalWidth: '75%'   // Width as a percentage
   * ```
   */
  modalWidth?: string;

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
 * API for displaying modals
 */
export interface ModalApi {
  /**
   * Opens a modal dialog
   *
   * @param config Modal configuration
   */
  open(config: ModalConfig): void;
}

/**
 * Configuration object for opening a slide-in panel.
 *
 * @property component - The Vue component to render in the slide-in panel.
 *                       This should be a valid Vue Component, such as an imported SFC or functional component.
 *
 * @property componentProps - (Optional) An object containing props to be passed to the component rendered in the slide-in panel.
 *                            Keys should match the props defined in the provided component.
 */
export interface SlideInConfig {
  component: Component | null;
  componentProps?: Record<string, any>;
}

export interface SlideInApi {
  /**
   * Opens the slide in
   *
   * @param config Slide-in configuration
   */
  open(config: SlideInConfig): void;
}

export interface ShellApi {
  /**
   * Provides access to the growl API
   */
  get growl(): GrowlApi;

  /**
   * Provides access to the modal API
   */
  get modal(): ModalApi;

  /**
   * Provides access to the slide-in API
   */
  get slideIn(): SlideInApi;  
}
