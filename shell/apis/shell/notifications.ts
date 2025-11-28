import { Store } from 'vuex';
import { NotificationApi } from '@shell/apis/intf/shell';
import { NotificationLevel, NotificationConfig } from '@shell/types/notifications';

export class NotificationApiImpl implements NotificationApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

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
   * * @returns notification ID
   *
   */
  public async send(level: NotificationLevel, title: string, message?:string, config?: NotificationConfig): Promise<string> {
    const notification = {
      level,
      title,
      message,
      ...config
    };

    return await this.store.dispatch('notifications/add', notification, { root: true });
  }

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
  public updateProgress(notificationId: string, progress: number): void {
    const notification = {
      id: notificationId,
      progress
    };

    this.store.dispatch('notifications/update', notification, { root: true });
  }
}
