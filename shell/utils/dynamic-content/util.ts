/**
 *
 * The code in this file provides utility functions for dynamic content
 *
 * First up is a helper to remove notifications that match a given prefix
 * Second up is a basic logging helper than will log to the console but can also log to local storage
 * so that we have a persistent log of what the dynamic content code has been doing to help with debugging
 *
 */

import { randomStr } from '@shell/utils/string';
import { Configuration, Context } from './types';
import { Notification } from '@shell/types/notifications';

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
  const all = getters['notifications/all'] || [];
  const ids = all.map((n: Notification) => n.id);

  for (let i = 0; i < ids.length; i++) {
    const notificationId = ids[i];

    if (notificationId.startsWith(prefix)) {
      if (notificationId === id) {
        found = true;
      } else {
        await dispatch('notifications/remove', notificationId);
        removed++;

        logger.debug(`Remove matching notifications ${ prefix }, ${ currentId } - removed notification ${ notificationId }`);
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

/**
 * Create a logger interface that can be used to log messages and errors appropriately
 * @param config Configuration to help us determine where and when to log
 * @returns Logger interface with methods to log for error, info and debug
 */
export function createLogger(config: Configuration) {
  return {
    error: (message: string, ...args: any[]) => log(config, 'error', message, ...args),
    info:  (message: string, ...args: any[]) => log(config, 'info', message, ...args),
    debug: (message: string, ...args: any[]) => log(config, 'debug', message, ...args),
  };
}

/**
 * Actual logging function that logs appropriately
 * @param config Configuration to help us determine where and when to log
 * @param level Log level (error, info, debug)
 * @param message Log message
 * @param arg Optional argument to be logged
 */
function log(config: Configuration, level: string, message: string, ...args: any[]) {
  // Log to the console when appropriate
  if (level === 'error') {
    console.error(message, ...args); // eslint-disable-line no-console
  } else if (level === 'info' && config.log) {
    console.info(message, ...args); // eslint-disable-line no-console
  } else if (level === 'debug' && config.debug) {
    console.debug(message, ...args); // eslint-disable-line no-console
  }

  // Only log to local storage if the configuration says we should
  if (config.log) {
    // Add the log message to the log we keep in local storage
    try {
      let data = [];

      // If we can't parse the data in local storage, then we will reset to an emptry array
      try {
        data = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_CONTENT_DEBUG_LOG) || '[]');
      } catch {}

      const item = {
        level,
        message,
        timestamp: new Date().toISOString(),
        args,
        uuid:      randomStr(),
      };

      data.unshift(item);

      // Limit the number of log messages
      window.localStorage.setItem(LOCAL_STORAGE_CONTENT_DEBUG_LOG, JSON.stringify(data.slice(0, MAX_LOG_MESSAGES)));

      // Send an event so the UI can update if necessary
      const event = new CustomEvent('dynamicContentLog', { detail: item });

      window.dispatchEvent(event);
    } catch {}
  }
}
