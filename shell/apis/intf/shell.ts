import { Component } from 'vue';

enum VALID_GROWL_TYPES {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * API for displaying growls in Rancher UI. Here's what a Growl looks like in Rancher UI:
 * * ![Growl Example](/img/growl.png)
 */
export interface GrowlApi {
  /**
   * Method to display a growl in Rancher UI
   *
   * Example:
   * ```ts
   * this.$shell.growl.show({
   *   message: 'Hello world!'
   * });
   * ```
   *
   * @param message Message object to configure growl being displayed
   */
  show(message: GrowlConfig): void;
}

/**
 * Growl Message configuration object
 */
export interface GrowlConfig {
  /**
   * Property that defines the title of the Growl
   */
  title?: string;

  /**
   * Property that defines the message content of the Growl
   */
  message: string;

  /**
   * Property that defines the Growl type, which also defines different base colors for the Growl
   *
   * Available types:
   * - `VALID_GROWL_TYPES.SUCCESS`: Indicates a successful operation (green color).
   * - `VALID_GROWL_TYPES.INFO`: Provides general information or a non-critical update (blue/teal color).
   * - `VALID_GROWL_TYPES.WARNING`: Signals a potential issue or action required (orange/yellow color).
   * - `VALID_GROWL_TYPES.ERROR`: Indicates a critical failure or necessary intervention (red color).
   */
  type?: VALID_GROWL_TYPES.SUCCESS | VALID_GROWL_TYPES.INFO | VALID_GROWL_TYPES.WARNING | VALID_GROWL_TYPES.ERROR;

  /**
   * Property that defines the duration (in milliseconds) for which the Growl should be displayed.
   * Defaults to `5000` milliseconds. A value of `0` keeps the Growl indefinitely.
   */
  timeout?: number;
}

/**
 * API for displaying modals in Rancher UI. Here's what a Modal looks like in Rancher UI:
 * * ![modal Example](/img/modal.png)
 */
export interface ModalApi {
  /**
   * Opens a modal dialog in Rancher UI
   *
   * @param config Modal configuration
   *
   * Example:
   * ```ts
   * import MyCustomModal from '@/components/MyCustomModal.vue';
   *
   * this.$shell.modal.show({
   *   component: MyCustomModal,
   *   componentProps: { title: 'Hello Modal' }
   * });
   * ```
   */
  open(config: ModalConfig): void;
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
   * this.$shell.modal.show({
   *   component: MyCustomModal,
   *   componentProps: { title: 'Hello Modal' }
   * });
   * ```
   */
  component: Component;

  /**
   * Props to pass directly to the component rendered inside the modal.
   *
   * Example:
   * ```ts
   * componentProps: { title: 'Hello Modal', isVisible: true }
   * ```
   */
  componentProps?: Record<string, any>;

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
 * API for displaying Slide In panels in Rancher UI
 * * ![slidein Example](/img/slidein.png)
 */
export interface SlideInApi {
  /**
   * Opens a slide in panel in Rancher UI
   *
   * @param config Slide-In configuration
   *
   *
   * Example:
   * ```ts
   * import MyCustomSlideIn from '@/components/MyCustomSlideIn.vue';
   *
   * this.$shell.slideIn.open({
   *   component: MyCustomSlideIn,
   *   componentProps: { title: 'Hello from SlideIn panel!' }
   * });
   * ```
   */
  open(config: SlideInConfig): void;
}

/**
 * Configuration object for opening a Slide-In panel. Here's what a Slide-In looks like in Rancher UI:
 *
 * @property component - The Vue component to render in the Slide-In panel.
 *                       This should be a valid Vue Component, such as an imported SFC or functional component.
 *
 * @property componentProps - (Optional) An object containing props to be passed to the component rendered in the Slide-In panel.
 *                            Keys should match the props defined in the provided component.
 */
export interface SlideInConfig {
  /**
   * The Vue component to be displayed inside the slide in panel.
   * This can be any SFC (Single-File Component) imported and passed in as a `Component`.
   *
   * Example:
   * ```ts
   * import MyCustomSlideIn from '@/components/MyCustomSlideIn.vue';
   *
   * this.$shell.slideIn.open({
   *   component: MyCustomSlideIn,
   *   componentProps: { title: 'Hello from SlideIn panel!' }
   * });
   * ```
   */
  component: Component;

  /**
   * Props to pass directly to the component rendered inside the slide in panel.
   *
   * Example:
   * ```ts
   * componentProps: { title: 'Hello from SlideIn panel!', isVisible: true }
   * ```
   */
  componentProps?: Record<string, any>;
}

/**
 * @internal
 * Available "API's" inside Shell API
 */
export interface ShellApi {
  /**
   * Provides access to the Growl API
   */
  get growl(): GrowlApi;

  /**
   * Provides access to the Modal API
   */
  get modal(): ModalApi;

  /**
   * Provides access to the Slide-In API
   */
  get slideIn(): SlideInApi;
}
