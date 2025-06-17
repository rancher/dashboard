import { md5 } from '@shell/utils/crypto';
import { randomStr } from '@shell/utils/string';
import { Notification } from '@shell/types/notifications';

/**
 * Key used to store notifications in the browser's local storage
 */
const LOCAL_STORAGE_KEY_PREFIX = 'rancher-notifications-';

/**
 * Expire in seconds (14 days)
 */
const EXPIRY = 14 * 24 * 60 * 60;

/**
 * Maximum number of notifications that will be kept
 */
const MAX_NOTIFICATIONS = 50;

/**
 * Store for the UI Notification Centre
 */

/**
 * Type for notification that is stored
 *
 * This should not be used outside of this store or the Notification Center UI components
 *
 * Includes extra fields managed by the notification center
 */
export type StoredNotification = {
  created: Date;
  read: Boolean;
} & Notification;

// Notifications store state
interface NotificationsStore {
  localStorageKey: string,
  notifications: StoredNotification[],
}

function persist(state: NotificationsStore) {
  window.localStorage.setItem(state.localStorageKey, JSON.stringify(state.notifications));
}

export const state = function(): NotificationsStore {
  const notifications: StoredNotification[] = [];

  // Note, the init action will load the notifications persisted in local storage at load time

  return {
    localStorageKey: '',
    notifications
  };
};

export const getters = {
  all: (state: NotificationsStore) => {
    return state.notifications;
  },

  item: (state: NotificationsStore) => {
    return (id: string) => {
      return state.notifications.find((i) => i.id === id);
    };
  },

  // Count of unread notifications
  unreadCount: (state: NotificationsStore) => {
    return state.notifications.filter((n) => !n.read).length;
  },

  /**
   * Local storage key includes the user key
   */
  localStorageKey: (state: NotificationsStore) => {
    return state.localStorageKey;
  },
};

export const mutations = {
  add(state: NotificationsStore, notification: Notification) {
    if (!notification.id) {
      notification.id = randomStr();
    } else {
      // Check that there is not already a notification with this id
      const index = state.notifications.findIndex((n) => n.id === notification.id);

      if (index !== -1) {
        console.error(`Can not add a notification with the same id as an existing notification (${ notification.id })`); // eslint-disable-line no-console

        return;
      }
    }

    const stored = {
      ...notification,
      read:    false,
      created: new Date()
    };

    // Add to top of list
    state.notifications.unshift(stored);

    // Check that we have not exceeded the maximum number of notifications
    if (state.notifications.length > MAX_NOTIFICATIONS) {
      state.notifications.pop();
    }

    persist(state);
  },

  markRead(state: NotificationsStore, id: string) {
    const notification = state.notifications.find((n) => n.id === id);

    if (notification && !notification.read) {
      notification.read = true;
    }

    persist(state);
  },

  markUnread(state: NotificationsStore, id: string) {
    const notification = state.notifications.find((n) => n.id === id);

    if (notification && notification.read) {
      notification.read = false;
    }

    persist(state);
  },

  markAllRead(state: NotificationsStore) {
    state.notifications.forEach((notification) => {
      if (!notification.read) {
        notification.read = true;
      }
    });

    persist(state);
  },

  update(state: NotificationsStore, notification: Partial<Notification>) {
    if (notification?.id) {
      const index = state.notifications.findIndex((n) => n.id === notification.id);

      if (index >= 0) {
        state.notifications[index] = {
          ...state.notifications[index],
          ...notification
        };
      }
    }
    persist(state);
  },

  clearAll(state: NotificationsStore) {
    state.notifications = [];

    persist(state);
  },

  remove(state: NotificationsStore, id: string) {
    state.notifications = state.notifications.filter((n) => n.id !== id);

    persist(state);
  },

  load(state: NotificationsStore, notifications: StoredNotification[]) {
    state.notifications = notifications;
  },

  localStorageKey(state: NotificationsStore, userKey: string) {
    state.localStorageKey = `${ LOCAL_STORAGE_KEY_PREFIX }${ userKey }`;
  },
};

export const actions = {
  add( { commit, dispatch }: any, notification: Notification) {
    commit('add', notification);

    // Show a growl for the notification if necessary
    dispatch('growl/notification', notification, { root: true });
  },

  fromGrowl( { commit }: any, notification: Notification) {
    notification.id = randomStr();

    commit('add', notification);

    return notification.id;
  },

  update({ commit }: any, notification: Notification) {
    commit('update', notification);
  },

  async markRead({ commit, dispatch, getters }: any, id: string) {
    commit('markRead', id);

    const notification = getters.item(id);

    if (notification?.preference) {
      await dispatch('prefs/set', notification.preference, { root: true });
    }
  },

  async markUnread({ commit, dispatch, getters }: any, id: string) {
    commit('markUnread', id);

    const notification = getters.item(id) as Notification;

    if (notification?.preference) {
      await dispatch('prefs/set', {
        key:   notification.preference.key,
        value: notification.preference.unsetValue || '',
      }, { root: true });
    }
  },

  async markAllRead({ commit, dispatch, getters }: any) {
    commit('markAllRead');

    // For all notifications that have a preference, set the preference, since they are now read
    const withPreference = getters.all.filter((n: Notification) => !!n.preference);

    for (let i = 0; i < withPreference.length; i++) {
      await dispatch('prefs/set', withPreference[i].preference, { root: true });
    }
  },

  remove({ commit }: any, id: string) {
    commit('remove', id);
  },

  clearAll({ commit }: any) {
    commit('clearAll');
  },

  init({ commit, getters } : any, userData: any) {
    const userKey = userData.id;

    if (!userKey) {
      console.error('Unable to initialize notifications - no user key available'); // eslint-disable-line no-console

      return;
    }

    // Notifications are stored under a key for the current user, so set the local storage key based on the user id
    commit('localStorageKey', md5(userKey, 'hex'));

    // Load persisted notifications from local storage
    let notifications = [];

    const localStorageKey = getters['localStorageKey'];

    try {
      notifications = JSON.parse(window.localStorage.getItem(localStorageKey) || '[]');
    } catch (e) {
      console.error('Unable to read notifications from local storage', e); // eslint-disable-line no-console
    }

    // Notifications needs to be an array, so check in case the data has been corrupted somehow and reset to empty state if so
    if (!Array.isArray(notifications)) {
      console.error('Notification data looks to be corrupt - ignoring persisted data'); // eslint-disable-line no-console

      notifications = [];
    }

    // Expire old notifications
    const now = new Date();

    notifications = notifications.filter((n: StoredNotification) => {
      // Try ... catch in case the date parsing fails
      try {
        const created = new Date(n.created);
        const diff = (now.getTime() - created.getTime()) / 1000; // Diff in seconds

        return diff < EXPIRY;
      } catch (e) {}

      return true;
    });

    commit('load', notifications);

    // Listen to storage events, so if open in multiple tabs, notifications in one tab will be sync'ed across all tabs
    window.addEventListener('storage', (ev) => {
      if (ev.key === localStorageKey) {
        try {
          const notifications = JSON.parse(ev.newValue || '[]') || [];

          commit('load', notifications);
        } catch (e) {
          console.error('Error parsing notifications from storage event', e); // eslint-disable-line no-console
        }
      }
    });
  }
};
