/**
 *
 * The code in this file is responsible for adding New Release notifications driven off of the dynamic content metadata
 *
 * We handle two cases:
 *
 * 1. There is a new patch release available for the current Rancher version (e.g. user is in 2.12.0 and we release 2.12.1)
 * 2. There is a new patch release available for the current Rancher version AND there is a newer version for a high minor releases
 *    > this often occurs because we release monthly releases in parallel with the new minor releases
 *
 * We show slightly different messages in these 2 cases.
 *
 */

import semver from 'semver';
import { NotificationLevel } from '@shell/types/notifications';
import { READ_NEW_RELEASE } from '@shell/store/prefs';
import { Context, ReleaseInfo, VersionInfo } from './types';
import { removeMatchingNotifications } from './util';
import { getReleaseNotesURL } from '@shell/utils/version';

export async function processReleaseVersion(context: Context, releaseInfo: ReleaseInfo[] | undefined, versionInfo: VersionInfo) {
  if (!releaseInfo || !versionInfo?.version || !Array.isArray(releaseInfo)) {
    return;
  }

  const { version } = versionInfo;
  const versions = releaseInfo.map((v: any) => semver.coerce(v.name));

  // Sort the versions, so that the newest is first in the list
  versions.sort((a: any, b: any) => semver.rcompare(a, b));

  // Find first newer version
  const newer = versions.find((v: any) => semver.gt(v, version));

  // Find newest patch version for the current version (if available)
  const newerPatch = versions.find((v: any) => {
    const newVersion = semver.coerce(v);

    return newVersion && newVersion.major === version.major && newVersion.minor === version.minor && semver.gt(v, version);
  });

  if (newer) {
    context.logger.info(`Found a newer release: ${ newer.version }`);

    if (newerPatch && newer !== newerPatch) {
      context.logger.info(`Also found a newer patch release: ${ newerPatch.version }`);
      // There is a new patch release and a newer release
      await addNewMultipleReleasesNotification(context, newerPatch.version, newer.version);
    } else {
      // There is a new release (but no newer patch release)
      await addNewReleaseNotification(context, newer.version);
    }
  }
}

async function addNewReleaseNotification(context: Context, version: string) {
  const prefix = 'new-release-';
  const releaseNotesUrl = getReleaseNotesURL(context.config.prime, version);

  const { dispatch, getters, logger } = context;

  // TODO: Get the preference
  const lastReadVersion = getters['prefs/get'](READ_NEW_RELEASE) || '';
  const t = getters['i18n/t'];

  // Delete notification(s) for old release notes
  // This shouldn't happen normally, as we release less often than notifications should expire
  if (!await removeMatchingNotifications(context, prefix, version) && lastReadVersion !== version) {
    logger.debug(`Adding new release notification for ${ version } because one did not exist`);

    const notification = {
      id:         `${ prefix }${ version }`,
      level:      NotificationLevel.Announcement,
      title:      t('dynamicContent.newRelease.title', { version }),
      message:    t('dynamicContent.newRelease.message', { version }),
      preference: {
        key:   READ_NEW_RELEASE,
        value: version
      },
      primaryAction: {
        label:  t('dynamicContent.newRelease.moreInfo'),
        target: releaseNotesUrl
      }
    };

    await dispatch('notifications/add', notification);
  }
}

async function addNewMultipleReleasesNotification(context: Context, version1: string, version2: string) {
  const prefix = 'new-release-';
  const key = `${ version1 }-${ version2 }`;
  const releaseNotesUrl1 = getReleaseNotesURL(context.config.prime, version1);
  const releaseNotesUrl2 = getReleaseNotesURL(context.config.prime, version2);
  const { dispatch, getters, logger } = context;

  // TODO: Get the preference
  const lastReadVersion = getters['prefs/get'](READ_NEW_RELEASE) || '';
  const t = getters['i18n/t'];

  // Delete notification(s) for old release notes
  // This shouldn't happen normally, as we release less often than notifications should expire
  if (!await removeMatchingNotifications(context, prefix, key) && lastReadVersion !== key) {
    logger.info(`Adding new multiple release notification for ${ version1 } and ${ version2 }`);

    const notification = {
      id:         `${ prefix }${ key }`,
      level:      NotificationLevel.Announcement,
      title:      t('dynamicContent.multipleNewReleases.title'),
      message:    t('dynamicContent.multipleNewReleases.message', { version1, version2 }),
      preference: {
        key:   READ_NEW_RELEASE,
        value: key
      },
      primaryAction: {
        label:  t('dynamicContent.multipleNewReleases.moreInfo', { version: version1 }),
        target: releaseNotesUrl1
      },
      secondaryAction: {
        label:  t('dynamicContent.multipleNewReleases.moreInfo', { version: version2 }),
        target: releaseNotesUrl2
      }
    };

    await dispatch('notifications/add', notification);
  }
}
