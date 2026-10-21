import { getVersionData } from '@shell/config/version';
import { READ_WHATS_NEW } from '@shell/store/prefs';
import { NotificationLevel } from '@shell/types/notifications';

const prefix = 'release-notes-';

/**
 * The running version the release notes are for, without the build suffix (e.g. 'v2.16.0')
 */
export function releaseNotesVersion(): string {
  return getVersionData().Version.split('-')[0];
}

export async function addReleaseNotesNotification(dispatch: any, getters: any) {
  const rancherVersion = releaseNotesVersion();
  const id = `${ prefix }${ rancherVersion }`;
  let found = false;
  const all = getters['notifications/all'];
  const lastReadVersion = getters['prefs/get'](READ_WHATS_NEW) || '';
  const t = getters['i18n/t'];
  const releaseNotesUrl = getters['releaseNotesUrl'];

  // Delete notification(s) for old release notes
  for (let i = 0; i < all.length; i++) {
    const notification = all[i];

    if (notification.id.startsWith(prefix)) {
      if (notification.id === id) {
        found = true;
      } else {
        await dispatch('notifications/remove', notification.id);
      }
    }
  }

  // Also use pref, so if we expired it, we don't add it back
  if (!found && lastReadVersion !== rancherVersion) {
    // Register notification
    const notification = {
      id,
      level:      NotificationLevel.Info,
      title:      t('landing.whatsNew.title', { version: rancherVersion }),
      message:    t('landing.whatsNew.message'),
      preference: {
        key:   READ_WHATS_NEW,
        value: rancherVersion
      },
      primaryAction: {
        label:  t('landing.whatsNew.link'),
        target: releaseNotesUrl
      }
    };

    await dispatch('notifications/add', notification);
  }
}

/**
 * Mark the release notes for the running version as read, like reading their notification does
 */
export async function markReleaseNotesRead(dispatch: any, getters: any) {
  const rancherVersion = releaseNotesVersion();
  const notification = getters['notifications/item'](`${ prefix }${ rancherVersion }`);

  if (notification && !notification.read) {
    await dispatch('notifications/markRead', notification.id);
  } else if (getters['prefs/get'](READ_WHATS_NEW) !== rancherVersion) {
    await dispatch('prefs/set', { key: READ_WHATS_NEW, value: rancherVersion });
  }
}
