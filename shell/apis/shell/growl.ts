import { Store } from 'vuex';
import { GrowlApi, GrowlConfig, VALID_GROWL_TYPES } from '@shell/apis/intf/shell';

export class GrowlApiImpl implements GrowlApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  /**
   * Dispatches a growl notification.
   *
   * Example:
   * ```ts
   * this.$shell.growl('success', 'Operation successful!', { timeout: 5000, title: 'Operation X feedback' });
   * ```
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
   *
   */
  public show(type: VALID_GROWL_TYPES, message: string, config?: GrowlConfig): void {
    this.store.dispatch(
      `growl/${ type }`,
      {
        title:   config?.title || '',
        message,
        timeout: config?.timeout || 5000,
      },
      { root: true }
    );
  }
}
