import { Notification, NotificationHandler } from "@shell/types/notifications";
import { READ_ANNOUNCEMENTS } from "@shell/store/prefs";
import { ANNOUNCEMENT_PREFIX } from './announcement';

export const DynamicContentNotificationHandlerName = 'dc-announcements';

/**
 * Create the dynamic content notification handler
 *
 * This is for announcements, where we need to manage an array of IDs of announcements that have been read, which
 * is taken care of by this custom handler.
 *
 * When a notification is read/unread that specifies this handler, we will add or remove its ID from the list of
 * read IDs that we maintain in the user preference value.
 *
 */
export function createHandler(store: any): NotificationHandler {
  return {
    async onReadUpdated(notification: Notification, read: boolean) {
      if (!notification.id.startsWith(ANNOUNCEMENT_PREFIX)) {
        return;
      }

      const id = notification.id.substring(ANNOUNCEMENT_PREFIX.length);
      const announcements = store.getters['notifications/all'].filter((n: any) => n.id.startsWith(ANNOUNCEMENT_PREFIX));
      const pref = store.getters['prefs/get'](READ_ANNOUNCEMENTS) || '';
      const values = !pref.length ? [] : pref.split(',').filter((v: string) => !announcements.includes(v));

      if (read) {
        values.push(id);
        values.sort();
      } else {
        values.splice(values.indexOf(id), 1);
      }

      await store.dispatch('prefs/set', { key: READ_ANNOUNCEMENTS, value: values.join(',') });
    }
  };
};
