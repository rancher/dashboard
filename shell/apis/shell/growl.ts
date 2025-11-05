import { Store } from 'vuex';
import { GrowlApi, GrowlMessage } from '@shell/apis/intf/shell';

export class GrowlApiImpl implements GrowlApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  /**
   * Dispatches a growl notification.
   *
   * @param config - Configuration for the growl notification.
   * - If `message` is a string, it is treated as the main content of the notification.
   * - If `message` is a `DetailedMessage` object, `title` and `description` are extracted.
   *
   * Example:
   * ```ts
   * this.$shell.growl({ message: 'Operation successful!', type: 'success' });
   * this.$shell.growl({ message: { title: 'Warning', description: 'Check your input.' }, type: 'warning' });
   * ```
   */
  public show(config: GrowlMessage): void {
    const { type = 'error' } = config;

    this.store.dispatch(
      `growl/${ type }`,
      {
        title:   config.title,
        message: config.message,
        timeout: config.timeout || 5000,
      },
      { root: true }
    );
  }
}
