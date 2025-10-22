import { RouteLocationRaw } from 'vue-router';

/**
 * Type definitions for the Notification Center
 */

/**
 * Notification Level for a notification in the Notification Center
 */
export enum NotificationLevel {
  Announcement = 0, // eslint-disable-line no-unused-vars
  Task, // eslint-disable-line no-unused-vars
  Info, // eslint-disable-line no-unused-vars
  Success, // eslint-disable-line no-unused-vars
  Warning, // eslint-disable-line no-unused-vars
  Error, // eslint-disable-line no-unused-vars
}

/**
 * An action that is shown as a button in the Notification Center
 */
export type NotificationAction = {
  label: string; // Button label for the action
  target?: string; // HREF target when the button is clicked
  route?: RouteLocationRaw; // Route to navigate to when the button is clicked
};

/**
 * Defines the User Preference linked to a notification
 */
export type NotificationPreference = {
  key: string; // User preference key to use when setting the preference when the notification is marked as read/unread
  value: string; // User preference value to use when setting the preference when the notification is marked as read
  unsetValue?: string; // User preference value to use when setting the preference when the notification is marked as unread - defaults to empty string
};

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
 * Interface for notification handler
 */
export interface NotificationHandler {
  /**
   * Called when a notification with this handler has its read status is updated (read or unread)
   *
   * @param notification Notification that was makred read or unread
   * @param read Indicates whether the notification was updated to be read or unread
   */
  onReadUpdated(notification: Notification, read: boolean): void;
}
