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
};

/**
 * An action that is shown as a button in the Notification Center
 */
export type NotificationAction = {
  label: string; // Button label for the action
  target?: string; // HREF target when the button is clicked
};

/**
 * Defines the User Preference linked to a notification
 */
export type NotificationPreference = {
  key: string; // User preference key to use when setting the preference when the notification is marked as read
  value: string; // User preference value to use when setting the preference when the notification is marked as read
  unsetValue?: string; // User preference value to use when setting the preference when the notification is marked as unread - defaults to empty string
};

/**
 * Type for Notification that is sent
 */
export type Notification = {
  // Unique ID for the notification
  id: string;
  // Title to be displayed in the notification
  title: string;
  // Message to be shown in the notification (optional)
  message?: string;
  // Notification Level
  level: NotificationLevel;
  // Progress (0-100) for notifications of type `Task` (optional)
  progress?: number;
  // Primary action to be shown in the notification (optional)
  primaryAction?: NotificationAction;
  // Secondary to be shown in the notification (optional)
  secondaryAction?: NotificationAction;
  // User Preference tied to the notification (optional) (the preference will be updated when the notification is marked read)
  preference?: NotificationPreference;
};
