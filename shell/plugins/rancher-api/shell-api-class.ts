import { Store } from 'vuex';

import { GrowlConfig, handleGrowl } from '@shell/utils/growl';

interface ShellApiOptions {
  store: Store<any>;
}

export default class ShellApi {
  protected $store: Store<any>;

  constructor(options: ShellApiOptions) {
    this.$store = options.store;
  }

  /**
   * Dispatches a growl notification based on the provided configuration.
   *
   * @param config - Configuration for the growl notification.
   *
   * The `config` parameter is an object of type `GrowlConfig`, which includes:
   * - `error`: An `ErrorMessage` object containing the details of the error to be displayed.
   *   This object can have an optional `data` property with `_statusText` and `message`,
   *   or these properties can be directly on the `error` object.
   * - `store`: A parameter representing the Vuex store used to dispatch actions.
   *   This is where the growl notification action will be dispatched.
   * - `type`: An optional string representing the type of notification (e.g., 'success', 'info', 'warning', 'error').
   *   If not provided, defaults to 'error'.
   * - `timeout`: An optional number representing the duration in milliseconds
   *   for which the notification should be displayed. Defaults to 5000 milliseconds if not provided.
   *
   * The action payload includes:
   * - `title`: The error status text.
   * - `message`: The detailed error message.
   * - `timeout`: The specified or default timeout duration.
   */
  growl(config: GrowlConfig): void {
    handleGrowl(config);
  }
}
