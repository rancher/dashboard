import { Store } from 'vuex';
import { NotificationApi } from '@shell/apis/intf/shell';

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
   * @param level
   * Notification level
   * The `level` specifies the importance of the notification and determines the icon that is shown in the notification
   *
   * |Level|Purpose|Icon|
   * |---|---|---|
   * |Announcement|An announcement. To be used when we want to inform on high-interest topics - news, updates, changes, scheduled maintenance, etc. E.g. “New version available!”|<img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-announcement.svg"/>|
   * |Task|A task that is underway. To be used when we want to inform on a process taking place - on-going actions that might take a while. E.g. “Cluster provisioning in progress”. The progress bar will also be shown if the `progress` field is set|<img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-busy.svg"/>|
   * |Info|Information notification. To be used when we want to inform on low-interest topics. E.g. “Welcome to Rancher v2.8"|<img class="svg-blue" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-info.svg"/>|
   * |Success|Notification that something has completed successfully. To be used when we want to confirm a successful action was completed. E.g. “Cluster provisioning completed”|<img class="svg-green" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-tick.svg"/>|
   * |Warning|Notification of a warning. To be used when we want to warn about a potential risk. E.g. “Nodes limitation warning”|<img class="svg-orange" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-warning.svg"/>|
   * |Error|Notification of an error. To be used when we want to alert on a confirmed risk. E.g. “Extension failed to load”|<img class="svg-red" src="https://raw.githubusercontent.com/rancher/icons/refs/heads/master/svg/notify-error.svg"/>|
   *
   * @param title The notification title
   * @param message The notification message to be displayed
   * @param config Notifications configuration object
   *
   */
  public send(notification?: any): void {
    this.store.dispatch('notifications/add', notification, { root: true });
  }
}
