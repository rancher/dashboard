import { Component } from 'vue';

export type VALID_GROWL_TYPES = 'success' | 'info' | 'warning' | 'error';
/**
 * Growl Message configuration object
 */
export interface GrowlConfig {
  /**
   * Property that defines the title of the Growl
   */
  title?: string;

  /**
   * Property that defines the duration (in milliseconds) for which the Growl should be displayed.
   * Defaults to `5000` milliseconds. A value of `0` keeps the Growl indefinitely.
   */
  timeout?: number;
}

/**
 * API for displaying growls in Rancher UI. Here's what a Growl looks like in Rancher UI:
 * * ![Growl Example](/img/growl.png)
 */
export interface GrowlApi {
  /**
   * Method to display a Growl notification in Rancher UI
   *
   * Example:
   * ```ts
   * this.$shell.growl.show('success', 'Hello world!');
   * ```
   *
   * For usage with the Composition API check usage guide [here](../../shell-api#using-composition-api-in-vue).
   *
   * @param type - Type of Growl notification
   *
   * Available types:
   * - `success`: Indicates a successful operation (green color).
   * - `info`: Provides general information or a non-critical update (blue/teal color).
   * - `warning`: Signals a potential issue or action required (orange/yellow color).
   * - `error`: Indicates a critical failure or necessary intervention (red color).
   *
   * @param message - Message to be displayed on the Growl notification
   * @param config - Growl configuration object
   */
  show(type: VALID_GROWL_TYPES, message:string, config?: GrowlConfig): void;
}

/**
 * Configuration object for opening a modal.
 */
export interface ModalConfig {
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
   * this.$shell.modal.show(MyCustomModal, {
   *   componentProps: { title: 'Hello Modal' }
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

/**
 *
 * Configuration object for opening a Slide-In panel. Here's what a Slide-In looks like in Rancher UI:
 *
 */
export interface SlideInConfig {
  /**
   *
   * Width of the Slide In panel in percentage, related to the window width. Defaults to `33%`
   *
   */
  width?: string;
  /**
   *
   * Height of the Slide In panel. Can be percentage or vh. Defaults to (window - header) height.
   * Can be set as `33%` or `80vh`
   *
   */
  height?: string;
  /**
   *
   * CSS Top position for the Slide In panel, string using px, as `0px` or `20px`. Default is right below header height
   *
   */
  top?: string;
  /**
   *
   * title for the Slide In panel
   *
   */
  title?: string;
  /**
   *
   * Wether Slide In header is displayed or not
   *
   */
  showHeader?: boolean;
  /**
   *
   * Props to pass directly to the component rendered inside the slide in panel in an object format
   *
   */
  componentProps?: Record<string, any>;
}

/**
 * API for displaying Slide In panels in Rancher UI
 * * ![slidein Example](/img/slidein.png)
 */
export interface SlideInApi {
  /**
   * Opens a slide in panel in Rancher UI
   *
   * Example:
   * ```ts
   * import MyCustomSlideIn from '@/components/MyCustomSlideIn.vue';
   *
   * this.$shell.slideIn.open(MyCustomSlideIn, {
   *   title: 'Hello from SlideIn panel!'
   * });
   * ```
   *
   * For usage with the Composition API check usage guide [here](../../shell-api#using-composition-api-in-vue).
   *
   * @param component
   * The Vue component to be displayed inside the slide in panel.
   * This can be any SFC (Single-File Component) imported and passed in as a `Component`.
   *
   * @param config Slide-In configuration object
   *
   */
  open(component: Component, config?: SlideInConfig): void;
}

export interface NotificationsApi {
  /**
   * Opens a slide in panel in Rancher UI
   *
   * Example:
   * ```ts
   * import MyCustomSlideIn from '@/components/MyCustomSlideIn.vue';
   *
   * this.$shell.slideIn.open(MyCustomSlideIn, {
   *   title: 'Hello from SlideIn panel!'
   * });
   * ```
   *
   * For usage with the Composition API check usage guide [here](../../shell-api#using-composition-api-in-vue).
   *
   * @param component
   * The Vue component to be displayed inside the slide in panel.
   * This can be any SFC (Single-File Component) imported and passed in as a `Component`.
   *
   * @param config Slide-In configuration object
   *
   */
  send(notification: any): void;
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

  /**
   * Provides access to the Notification Center API
   */
  get notifications(): NotificationsApi;
}
