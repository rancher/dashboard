import { Store } from 'vuex';

export interface Message {
  data?: {
    _statusText: string,
    message: string
  }
  _statusText?: string,
  message?: string
}

export interface GrowlConfig {
  message: Message,
  store: Store<any>,
  type?: string,
  timeout?: number
}

/**
 * Dispatches a growl notification based on the provided configuration.
 *
 * @param config - Configuration for the growl notification.
 *
 * The `config` parameter is an object of type `GrowlConfig`, which includes:
 * - `message`: An `Message` object containing the details of the error to be displayed.
 *   This object can have an optional `data` property with `_statusText` and `message`,
 *   or these properties can be directly on the `error` object.
 * - `store`: A parameter representing the Vuex store used to dispatch actions.
 *   This is where the growl notification action will be dispatched.
 * - `type`: An optional string representing the type of notification (e.g., 'success', 'info', 'warning', 'error').
 *   If not provided, defaults to 'error'.
 * - `timeout`: An optional number representing the duration in milliseconds
 *   for which the notification should be displayed. Defaults to 5000 milliseconds if not provided.
 *
 * The function extracts error details either from `config.error.data` or `config.error`
 * (if `data` is not present), and dispatches a growl notification action to the store.
 * The action dispatched is of the form `growl/[type]` where `[type]` is either
 * the provided type in the config or 'error' by default.
 *
 * The action payload includes:
 * - `title`: The error status text.
 * - `message`: The detailed error message.
 * - `timeout`: The specified or default timeout duration.
 */
export function handleGrowl(config: GrowlConfig): void {
  const message = config.message?.data || config.message;

  config.store.dispatch(`growl/${ config.type || 'error' }`, {
    title:   message._statusText,
    message: message.message,
    timeout: config.timeout || 5000,
  }, { root: true });
}
