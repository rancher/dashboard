/**
 * Notification handler for dynamic content announcements
 *
 * This provides custom handling for read/unread state using a single user preference
 */
import { Notification, NotificationHandler } from '@shell/types/notifications';
import { READ_ANNOUNCEMENTS } from '@shell/store/prefs';
import { ANNOUNCEMENT_PREFIX } from './announcement';

// Global name for this handler that can be used when creating notifications to associate them with this handler
export const DynamicContentAnnouncementHandlerName = 'dc-announcements';

/**
 * Create the dynamic content notification handler
 *
 * This is for announcements, where we need to manage an array of IDs of announcements that have been read, which
 * is taken care of by this custom handler.
 *
 * When a notification is read/unread that specifies this handler, we will add or remove its ID from the list of
 * read IDs that we maintain in the user preference value.
 *
 * This allows us to use a single user preference to track read announcements
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
      const valuesUnique = new Set(values);

      if (read) {
        valuesUnique.add(id);
      } else {
        valuesUnique.delete(id);
      }

      const newValues = Array.from(valuesUnique).sort();

      await store.dispatch('prefs/set', { key: READ_ANNOUNCEMENTS, value: newValues.join(',') });
    }
  };
}
