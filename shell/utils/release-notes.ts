import { getVersionData } from '@shell/config/version';
import { READ_WHATS_NEW } from '@shell/store/prefs';
import { NotificationLevel } from '@shell/types/notifications';

export async function addReleaseNotesNotification(dispatch: any, getters: any) {
  const rancherVersion = getVersionData().Version.split('-')[0];
  const prefix = 'release-notes-';
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
