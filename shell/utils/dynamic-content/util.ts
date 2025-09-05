import { randomStr } from '@shell/utils/string';
import { Configuration, Context } from './types';

const MAX_LOG_MESSAGES = 50;

export const LOCAL_STORAGE_CONTENT_DEBUG_LOG = 'rancher-updates-debug-log';

/**
 * Remove all notifications that have the given prefix, except the one that has the specified current id
 *
 * Returns whether a notification with the current id was found
 *
 * @param dispatch Store dispatcher
 * @param getters Store getters
 * @param prefix Prefix to look for and remove notifications whose IDs start with this prefix
 * @param currentId  Current ID of notification to keep, if present
 * @returns If a notification with the current ID was found
 */
export async function removeMatchingNotifications(context: Context, prefix: string, currentId: string): Promise<boolean> {
  const { dispatch, getters, logger } = context;
  const id = `${ prefix }${ currentId }`;
  let found = false;
  let removed = 0;
  const all = getters['notifications/all'];

  for (let i = 0; i < all.length; i++) {
    const notification = all[i];

    if (notification.id.startsWith(prefix)) {
      if (notification.id === id) {
        found = true;
      } else {
        await dispatch('notifications/remove', notification.id);
        removed++;

        logger.debug(`Remove matching notifications ${ prefix }, ${ currentId } - removed notification ${ notification.id }`);
      }
    }
  }

  if (found) {
    logger.debug(`Remove matching notifications ${ prefix }, ${ currentId } - found an existing notification (removed ${ removed })`);
  } else {
    logger.debug(`Remove matching notifications ${ prefix }, ${ currentId } - did not find an existing notification (removed ${ removed })`);
  }

  return found;
}

export function createLogger(config: Configuration) {
  return {
    error: (message: string, arg?: any) => log(config, 'error', message, arg),
    info:  (message: string, arg?: any) => log(config, 'info', message, arg),
    debug: (message: string, arg?: any) => log(config, 'debug', message, arg),
  };
}

export function log(config: Configuration, level: string, message: string, arg?: any) {
  // Log to the console when appropriate
  if (level === 'error') {
    arg ? console.error(message, arg) : console.error(message); // eslint-disable-line no-console
  } else if (level === 'info' && config.log) {
    arg ? console.info(message, arg) : console.info(message); // eslint-disable-line no-console
  } else if (level === 'debug' && config.debug) {
    arg ? console.debug(message, arg) : console.debug(message); // eslint-disable-line no-console
  }

  // Only log to local storage if the configuration says we should (either log or debug configured in the setting)
  if (config.log) {
    // Add the log message to the log we keep in local storage
    try {
      const data = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_CONTENT_DEBUG_LOG) || '[]');

      const item = {
        level,
        message,
        timestamp: new Date().toISOString(),
        arg,
        uuid:      randomStr(),
      };

      data.unshift(item);

      // Limit the number of log messages
      window.localStorage.setItem(LOCAL_STORAGE_CONTENT_DEBUG_LOG, JSON.stringify(data.slice(0, MAX_LOG_MESSAGES)));

      // Send an event so a UI can update if necessary
      const event = new CustomEvent('dynamicContentLog', { detail: item });

      window.dispatchEvent(event);
    } catch {}
  }
}
