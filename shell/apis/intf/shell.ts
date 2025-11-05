import { Component } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import { NotificationLevel } from '@shell/types/notifications';

/**
 * Configuration object for opening a modal.
 */
export interface ModalApiConfig {
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
  open(component: Component, config?: ModalApiConfig): void;
}

/**
 *
 * Configuration object for opening a Slide-In panel. Here's what a Slide-In looks like in Rancher UI:
 *
 */
export interface SlideInApiConfig {
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
  open(component: Component, config?: SlideInApiConfig): void;
}

/**
 * Notification Action definition
 */
export interface NotificationApiAction {
  /**
   * Button label for the action
   */
  label: string;
  /**
   * Href target when the button is clicked
   */
  target?: string;
  /**
   * Vue Route to navigate to when the button is clicked
   */
  route?: RouteLocationRaw;
}

/**
 * Notification Preference definition
 */
export interface NotificationApiPreference {
  /**
   * User preference key to use when setting the preference when the notification is marked as read
   */
  key: string;
  /**
   * User preference value to use when setting the preference when the notification is marked as read
   */
  value: string;
  /**
   * User preference value to use when setting the preference when the notification is marked as unread - defaults to empty string
   */
  unsetValue?: string;
}

/**
 * Configuration object for the Notification Center
 *
 */
export interface NotificationApiConfig {
  /**
   * - **{@link NotificationApiAction}**
   *
   * Primary action to be shown in the notification
   */
  primaryAction?: NotificationApiAction;
  /**
   * - **{@link NotificationApiAction}**
   *
   * Secondary to be shown in the notification
   */
  secondaryAction?: NotificationApiAction;
  /**
   * Unique ID for the notification
   */
  id?: string;
  /**
   * Progress (0-100) for notifications of type `Task`
   */
  progress?: number;
  /**
   * - **{@link NotificationApiPreference}**
   *
   * User Preference tied to the notification (the preference will be updated when the notification is marked read)
   */
  preference?: NotificationApiPreference;
}

/**
 * Notification Level for a notification in the Notification Center
 */
export enum NotificationApiLevel {
  /**
   * An announcement. To be used when we want to inform on high-interest topics - news, updates, changes, scheduled maintenance, etc. E.g. “New version available!” <img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-announcement.svg" width="20" />
   */
  Announcement = 0, // eslint-disable-line no-unused-vars
  /**
   * A task that is underway. To be used when we want to inform on a process taking place - on-going actions that might take a while. E.g. “Cluster provisioning in progress”. The progress bar will also be shown if the `progress` field is set <img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-busy.svg" width="20" />
   */
  Task, // eslint-disable-line no-unused-vars
  /**
   * Information notification. To be used when we want to inform on low-interest topics. E.g. “Welcome to Rancher v2.8" <img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-info.svg"/>
   */
  Info, // eslint-disable-line no-unused-vars
  /**
   * Notification that something has completed successfully. To be used when we want to confirm a successful action was completed. E.g. “Cluster provisioning completed” <img class="svg-green" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-tick.svg"/>
   *
   * A notification of type `Success` will also show a growl notication on Rancher UI
   * * ![success Example](/img/notifications/success.png)
   */
  Success, // eslint-disable-line no-unused-vars
  /**
   * Notification of a warning. To be used when we want to warn about a potential risk. E.g. “Nodes limitation warning” <img class="svg-orange" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-warning.svg"/>
   *
   * A notification of type `Warning` will also show a growl notication on Rancher UI
   * * ![warning Example](/img/notifications/warning.png)
   */
  Warning, // eslint-disable-line no-unused-vars
  /**
   * Notification of an error. To be used when we want to alert on a confirmed risk. E.g. “Extension failed to load” <img class="svg-red" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-error.svg"/>
   *
   * A notification of type `Error` will also show a growl notication on Rancher UI
   * * ![error Example](/img/notifications/error.png)
   */
  Error, // eslint-disable-line no-unused-vars
}

/**
 * API for notifications in the Rancher UI Notification Center
 * * ![notification Example](/img/notification.png)
 */
export interface NotificationApi {
  /**
   * Sends a notification to the Rancher UI Notification Center
   *
   * Example:
   * ```ts
   * import { NotificationLevel } from '@shell/types/notifications';
   *
   * this.$shell.notification.send(NotificationLevel.Success, 'Some notification title', 'Hello world! Success!', {})
   * ```
   *
   * For usage with the Composition API check usage guide [here](../../shell-api#using-composition-api-in-vue).
   *
   * @param level The `level` specifies the importance of the notification and determines the icon that is shown in the notification
   * @param title The notification title
   * @param message The notification message to be displayed
   * @param config Notifications configuration object
   *
   * @returns notification ID
   *
   */
  send(level: NotificationApiLevel | NotificationLevel, title: string, message?:string, config?: NotificationApiConfig): Promise<string>;

  /**
   * Update notification progress (Only valid for notifications of type `Task`)
   *
   * Example:
   * ```ts
   * this.$shell.notification.updateProgress('some-notification-id', 80)
   * ```
   *
   * For usage with the Composition API check usage guide [here](../../shell-api#using-composition-api-in-vue).
   *
   * @param notificationId Unique ID for the notification
   * @param progress Progress (0-100) for notifications of type `Task`
   *
   */

  updateProgress(notificationId: string, progress: number): void;
}

/**
 * API for system related information
 * * ![system Example](/img/system.png)
 */
export interface SystemApi {
  /**
   * Rancher version
   */
  rancherVersion: string;
  /**
   * Rancher UI version
   */
  uiVersion: string;
  /**
   * Rancher CLI version
   */
  cliVersion: string;
  /**
   * Rancher Helm version
   */
  helmVersion: string;
  /**
   * Rancher Docker Machine version
   */
  machineVersion: string;
  /**
   * If Rancher system running is Prime
   */
  isRancherPrime: boolean;
  /**
   * Git Commit for Rancher system running
   */
  gitCommit: string;
  /**
   * Rancher Kubernetes version
   */
  kubernetesVersion: string;
  /**
   * Rancher build platform
   */
  buildPlatform: string;
  /**
   * If Rancher system is a Dev build
   */
  isDevBuild: boolean;
  /**
   * If Rancher system is a Pre-Release build/version
   */
  isPrereleaseVersion: boolean;
}

/**
 * @internal
 * Available "API's" inside Shell API
 */
export interface ShellApi {
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
  get notification(): NotificationApi;

  /**
   * Provides access to the System API
   */
  get system(): SystemApi;
}
