/**
 *
 * The code in this file is responsible for adding 'announcement 'notifications driven off of the dynamic content metadata
 *
 * Announcements will be able to be shown in different places in the UI
 *
 */

import semver from 'semver';
import { NotificationLevel, Notification } from '@shell/types/notifications';
import { READ_ANNOUNCEMENTS } from '@shell/store/prefs';
import { Context, VersionInfo, Announcement } from './types';
import { DynamicContentAnnouncementHandlerName } from './notification-handler';

// Prefixes used in the notifications IDs created here
export const ANNOUNCEMENT_PREFIX = 'announcement-';

const TARGET_NOTIFICATION_CENTER = 'notification';
const TARGET_HOME_PAGE = 'homepage';
const ALLOWED_TARGETS = [TARGET_NOTIFICATION_CENTER, TARGET_HOME_PAGE];

const ALLOWED_NOTIFICATIONS: Record<string, NotificationLevel> = {
  announcement: NotificationLevel.Announcement,
  info:         NotificationLevel.Info,
  warning:      NotificationLevel.Warning,
  homepage:     NotificationLevel.Hidden,
};

/**
 * Main exported function that will process the announcements
 *
 * @param context Context helper providing access to config, logger, store
 * @param announcements Announcement information
 * @param versionInfo Version information
 */
export async function processAnnouncements(context: Context, announcements: Announcement[] | undefined, versionInfo: VersionInfo): Promise<void> {
  if (!announcements || !announcements.length || !versionInfo?.version) {
    return;
  }

  const { dispatch, getters, logger } = context;

  // Process each announcement
  await Promise.all(announcements.map(async(announcement: Announcement) => {
    // Check version
    if (announcement.version && !semver.satisfies(versionInfo.version, announcement.version)) {
      return;
    }

    // Check audience (currently only admin or all, but may add more in the future)
    if (announcement.audience === 'admin' && !context.isAdmin) {
      return;
    }

    // Check type
    const targetSplit = announcement.target.split('/');
      const target = targetSplit[0];

    if (targetSplit[0] === 'notification') {
      // Show a notification
      const subType = targetSplit.length === 2 ? targetSplit[1] : 'announcement';

      // Because 0 is a falsy, see if we find something of type number to check for existence
      if (typeof ALLOWED_NOTIFICATIONS[subType] !== 'number') {
        logger.error(`Announcement notification type ${ subType } is not supported`);
      } else {
        logger.info(`Going to add a notification for announcement ${ announcement.target }`);

        if (!announcement.id) {
          logger.error(`No ID For announcement - not going to add a notification for the announcement`);

          return;
        }

        // We should check if the notification already exists
        const id = `${ ANNOUNCEMENT_PREFIX }${ announcement.id }`;
        const existing = getters['notifications/item'](id);

        // Check if the pref for 'read announcements' has the id
        const pref = getters['prefs/get'](READ_ANNOUNCEMENTS) || '';
        const prefExists = pref.split(',').includes(announcement.id);

        if (existing || prefExists) {
          logger.info(`Not adding announcement with ID ${ id } as it already exists or has been read previously (title: ${ announcement.title })`);

          return;
        }
        const notification: Notification = {
          id,
          level:       ALLOWED_NOTIFICATIONS[subType],
          title:       announcement.title,
          message:     announcement.message,
          handlerName: DynamicContentAnnouncementHandlerName,
            data,
        };

        if (announcement.cta?.primary) {
          notification.primaryAction = {
            label:  announcement.cta.primary.action,
            target: announcement.cta.primary.link,
          };
        }

        if (announcement.cta?.secondary) {
          notification.secondaryAction = {
            label:  announcement.cta.secondary.action,
            target: announcement.cta.secondary.link,
          };
        }

          logger.info(`Adding announcement with ID ${ id } (title: ${ announcement.title }, target: ${ announcement.target })`);

        await dispatch('notifications/add', notification);
      }
    } else {
      logger.error(`Announcement type ${ announcement.target } is not supported`);
    }
  }));
}
