import { NotificationApiAction, NotificationApiPreference } from '@shell/apis/intf/shell';

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
 * An action that is shown as a button in the Notification Center
 */
export type NotificationAction = NotificationApiAction;

/**
 * Defines the User Preference linked to a notification
 */
export type NotificationPreference = NotificationApiPreference;

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
