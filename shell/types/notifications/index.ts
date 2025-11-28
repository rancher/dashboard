import { RouteLocationRaw } from 'vue-router';

/**
 * Type definitions for the Notification Center
 */

export enum NotificationLevel {
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
   */
  Success, // eslint-disable-line no-unused-vars
  /**
   * Notification of a warning. To be used when we want to warn about a potential risk. E.g. “Nodes limitation warning” <img class="svg-orange" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-warning.svg"/>
   */
  Warning, // eslint-disable-line no-unused-vars
  /**
   * Notification of an error. To be used when we want to alert on a confirmed risk. E.g. “Extension failed to load” <img class="svg-red" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-error.svg"/>
   */
  Error, // eslint-disable-line no-unused-vars
  Hidden, // eslint-disable-line no-unused-vars
}

/**
 * Notification Action definition
 */
export interface NotificationAction {
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
export interface NotificationPreference {
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
export interface NotificationConfig {
  /**
   * - **{@link NotificationAction}**
   *
   * Primary action to be shown in the notification
   */
  primaryAction?: NotificationAction;
  /**
   * - **{@link NotificationAction}**
   *
   * Secondary to be shown in the notification
   */
  secondaryAction?: NotificationAction;
  /**
   * Unique ID for the notification
   */
  id?: string;
  /**
   * Progress (0-100) for notifications of type `Task`
   */
  progress?: number;
  /**
   * - **{@link NotificationPreference}**
   *
   * User Preference tied to the notification (the preference will be updated when the notification is marked read)
   */
  preference?: NotificationPreference;
}

/**
 * Type for Encrypted Notification data that is stored in local storage
 */
export type EncryptedNotification = {
  title: string;
  // Message to be shown in the notification (optional)
  message?: string;
  // Notification Level
  level: NotificationLevel;
  // Primary action to be shown in the notification (optional)
  primaryAction?: NotificationAction;
  // Secondary to be shown in the notification (optional)
  secondaryAction?: NotificationAction;
  // User Preference tied to the notification (optional) (the preference will be updated when the notification is marked read)
  preference?: NotificationPreference;
  // Handler to be associated with this notification that can invoke additional behaviour when the notification changes
  // This is the name of the handler (the handlers are added as extensions). Notifications are persisted in the store, so can't use functions.
  handlerName?: string;
  // Additional data to be stored with the notification (optional)
  data?: any;
};

/**
 * Type for Notification that is sent
 */
export type Notification = {
  // Unique ID for the notification
  id: string;
  // Progress (0-100) for notifications of type `Task` (optional)
  progress?: number;
} & EncryptedNotification;

/**
 * Type for notification that is stored
 *
 * This should not be used outside of this store or the Notification Center UI components
 *
 * Includes extra fields managed by the notification center
 */
export type StoredNotification = {
  created: Date;
  read: Boolean;
} & Notification;

/**
 * Name to use when registering a custom notification handler
 */
export const NotificationHandlerExtensionName = 'notification-handler';

/**
 * Interface for notification handler
 */
export interface NotificationHandler {
  /**
   * Called when a notification with this handler has its read status is updated (read or unread)
   *
   * @param notification Notification that was marked read or unread
   * @param read Indicates whether the notification was updated to be read or unread
   */
  onReadUpdated(notification: Notification, read: boolean): void;
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
  send(level: NotificationLevel | NotificationLevel, title: string, message?:string, config?: NotificationConfig): Promise<string>;

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
