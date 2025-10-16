/**
 *
 * The code in this file is responsible for adding Support notifications driven off of the dynamic content metadata
 *
 * This covers these cases:
 *
 * 1. Current release has reached  End of Maintenance (EOL)
 * 2. Current release has reached End of Maintenance (EOM)
 * 3. Current release is approaching End of Maintenance (EOL)
 * 4. Current release is approaching End of Maintenance (EOM)
 *
 * Note that we process in the order to that shown above, and stop at the first one that is active - so reaching EOL will show a notification
 * and we won't look at the others.
 *
 */

import semver from 'semver';
import day from 'dayjs';
import { NotificationLevel } from '@shell/types/notifications';
import { READ_SUPPORT_NOTICE, READ_UPCOMING_SUPPORT_NOTICE } from '@shell/store/prefs';
import { removeMatchingNotifications } from './util';
import { Context, VersionInfo, UpcomingSupportInfo, SupportInfo } from './types';
import { UPDATE_DATE_FORMAT } from './index';

// Number of days ahead of upcoming EOM or EOL that we will notify the user
const DEFAULT_UPCOMING_WINDOW = 30;

// Prefixes used in the notifications IDs created here
const SUPPORT_NOTICE_PREFIX = 'support-notice-';
const UPCOMING_SUPPORT_NOTICE_PREFIX = 'upcoming-support-notice-';

// Prefixes used in the value of the user preference to track which notifications the user has read
const PREFIX = {
  EOM: 'eom',
  EOL: 'eol',
};

// Internal type used with convenience functions
type Config = {
  prefValuePrefix?: string;
  pref: any;
  notificationPrefix: string;
  titleKey: string;
  messageKey: string;
};

/**
 * Main exported function that will process the support (stateInfo)
 *
 * @param context Context helper providing access to config, logger, store
 * @param statusInfo Support information
 * @param versionInfo Version information
 */

export async function processSupportNotices(context: Context, statusInfo: SupportInfo | undefined, versionInfo: VersionInfo): Promise<void> {
  if (!statusInfo || !versionInfo?.version) {
    return;
  }

  const { version } = versionInfo;
  const { logger } = context;

  // TODO: ****************************************************************************************
  // TODO: Check if the user is an admin if we are Prime - we only notify admins of EOM and EOL
  // TODO: ****************************************************************************************

  const status = statusInfo.status || {};
  const majorMinor = `${ semver.major(version) }.${ semver.minor(version) }`;

  // Check if this version is EOL - we warn of EOL
  // If a version is EOL, then is has passed EOM, so we don't need to check that
  if (status.eol && semver.satisfies(version, status.eol)) {
    logger.info(`This version (${ version }) is End of Life`);

    return await checkAndAddNotification(context, {
      prefValuePrefix:    PREFIX.EOL,
      pref:               READ_SUPPORT_NOTICE,
      notificationPrefix: SUPPORT_NOTICE_PREFIX,
      titleKey:           'dynamicContent.eol.title',
      messageKey:         'dynamicContent.eol.message',
    }, majorMinor);
  }

  if (status.eom && semver.satisfies(version, status.eom)) {
    logger.info(`This version (${ version }) is End of Maintenance`);

    return await checkAndAddNotification(context, {
      prefValuePrefix:    PREFIX.EOM,
      pref:               READ_SUPPORT_NOTICE,
      notificationPrefix: SUPPORT_NOTICE_PREFIX,
      titleKey:           'dynamicContent.eom.title',
      messageKey:         'dynamicContent.eom.message',
    }, majorMinor);
  }

  // Now check for upcoming EOL or EOM

  // Upcoming EOL
  if (statusInfo.upcoming?.eol && semver.satisfies(version, statusInfo.upcoming.eol.version)) {
    if (await checkAndAddUpcomingNotification(context, statusInfo.upcoming.eol, {
      prefValuePrefix:    PREFIX.EOL,
      pref:               READ_UPCOMING_SUPPORT_NOTICE,
      notificationPrefix: UPCOMING_SUPPORT_NOTICE_PREFIX,
      titleKey:           'dynamicContent.upcomingEol.title',
      messageKey:         'dynamicContent.upcomingEol.message',
    }, majorMinor)) {
      return;
    }
  }

  // Upcoming EOM
  if (statusInfo.upcoming?.eom && semver.satisfies(version, statusInfo.upcoming.eom.version)) {
    await checkAndAddUpcomingNotification(context, statusInfo.upcoming.eom, {
      prefValuePrefix:    PREFIX.EOM,
      pref:               READ_UPCOMING_SUPPORT_NOTICE,
      notificationPrefix: UPCOMING_SUPPORT_NOTICE_PREFIX,
      titleKey:           'dynamicContent.upcomingEom.title',
      messageKey:         'dynamicContent.upcomingEom.message',
    }, majorMinor);
  }
}

async function checkAndAddUpcomingNotification(context: Context, info: UpcomingSupportInfo, config: Config, majorMinor: string): Promise<boolean> {
  const now = day(day().format(UPDATE_DATE_FORMAT));
  const upcomingDate = day(day(info.date).format(UPDATE_DATE_FORMAT));
  const distance = upcomingDate.diff(now, 'day');
  const noticeWindow = info.noticeDays || DEFAULT_UPCOMING_WINDOW;

  // If we've passed the upcoming date, then ignore, as this should have been covered by the eom status
  if (distance > 0 && distance < noticeWindow) {
    await checkAndAddNotification(context, config, majorMinor, distance);

    return true;
  }

  return false;
}

/**
 * Check if a notification already exists or has already been read and if not, add it
 *
 * @param context Context helper providing access to config, logger, store
 * @param config Configuration for the notification
 * @param majorMinor Major.Minor version number
 * @param distance Number of days until the event occurs (for upcoming support events)
 */
async function checkAndAddNotification(context: Context, config: Config, majorMinor: string, distance?: number) {
  const { dispatch, getters, logger } = context;
  const t = getters['i18n/t'];
  const lastReadNotice = getters['prefs/get'](config.pref) || '';
  const prefValue = config.prefValuePrefix ? `${ config.prefValuePrefix }-${ majorMinor }` : majorMinor;

  if (!await removeMatchingNotifications(context, config.notificationPrefix, prefValue) && lastReadNotice !== prefValue) {
    const notification = {
      id:         `${ config.notificationPrefix }${ prefValue }`,
      level:      NotificationLevel.Warning,
      title:      t(config.titleKey, { version: majorMinor, days: distance }),
      message:    t(config.messageKey, { version: majorMinor, days: distance }),
      preference: {
        key:   config.pref,
        value: prefValue
      },
    };

    logger.info(`Adding support notification for ${ majorMinor } (${ config.notificationPrefix }${ config.prefValuePrefix })`);

    await dispatch('notifications/add', notification);
  }
}
