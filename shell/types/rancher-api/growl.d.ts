export interface DetailedMessage {
  title?: string;
  description: string;
}

export interface GrowlConfig {
  /**
   * The content of the notification message.
   * Either a simple string or an object with `title` and `description` for detailed notifications.
   */
  message: string | DetailedMessage;

  /**
   * Optional type of the growl notification.
   * Determines the visual style of the notification.
   * Defaults to `'error'` if not provided.
   */
  type?: 'success' | 'info' | 'warning' | 'error';

  /**
   * Optional duration (in milliseconds) for which the notification should be displayed.
   * Defaults to `5000` milliseconds. A value of `0` keeps the notification indefinitely.
   */
  timeout?: number;
}
