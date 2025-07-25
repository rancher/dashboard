import { md5 } from '@shell/utils/crypto';
import { randomStr } from '@shell/utils/string';
import { Notification, StoredNotification } from '@shell/types/notifications';
import { deriveKey } from '@shell/utils/crypto/encryption';
import { loadFromString } from '@shell/utils/notifications';
import { debounce } from 'lodash';

/**
 * Key used to store notifications in the browser's local storage
 */
const LOCAL_STORAGE_KEY_PREFIX = 'rancher-notifications-';

/**
 * Expire notifications in seconds (14 days)
*/
const EXPIRY = 14 * 24 * 60 * 60;

/**
 * Maximum number of notifications that will be kept
 */
const MAX_NOTIFICATIONS = 50;

/**
 * Store for the UI Notification Centre
 */
interface NotificationsStore {
  localStorageKey: string,
  userId: string;
  notifications: StoredNotification[],
  encryptionKey: CryptoKey | undefined,
}

export const state = function(): NotificationsStore {
  const notifications: StoredNotification[] = [];

  return {
    localStorageKey: '',
    userId:          '',
    encryptionKey:   undefined,
    notifications,
  };
};

const debounceSetNotifications = debounce((state: NotificationsStore, notifications: StoredNotification[]) => {
  state.notifications = notifications;
}, 500);

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

  userId: (state: NotificationsStore) => {
    return state.userId;
  },

  encryptionKey: (state: NotificationsStore) => {
    return state.encryptionKey;
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
  },

  markRead(state: NotificationsStore, id: string) {
    const notification = state.notifications.find((n) => n.id === id);

    if (notification && !notification.read) {
      notification.read = true;
    }
  },

  markUnread(state: NotificationsStore, id: string) {
    const notification = state.notifications.find((n) => n.id === id);

    if (notification && notification.read) {
      notification.read = false;
    }
  },

  markAllRead(state: NotificationsStore) {
    state.notifications.forEach((notification) => {
      if (!notification.read) {
        notification.read = true;
      }
    });
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
  },

  clearAll(state: NotificationsStore) {
    state.notifications = [];
  },

  remove(state: NotificationsStore, id: string) {
    state.notifications = state.notifications.filter((n) => n.id !== id);
  },

  load(state: NotificationsStore, notifications: StoredNotification[]) {
    // On load, check that the data actually is different
    const existingData = JSON.stringify(state.notifications);
    const newData = JSON.stringify(notifications);

    if (existingData !== newData) {
      debounceSetNotifications(state, notifications);
    }
  },

  localStorageKey(state: NotificationsStore, userKey: string) {
    state.localStorageKey = `${ LOCAL_STORAGE_KEY_PREFIX }${ userKey }`;
  },

  userId(state: NotificationsStore, userId: string) {
    state.userId = userId;
  },

  encryptionKey(state: NotificationsStore, encryptionKey: CryptoKey) {
    state.encryptionKey = encryptionKey;
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

  load({ commit }: any, data: StoredNotification[]) {
    commit('load', data);
  },

  /**
   * Initialize the notifications store and load the notifications from local storage
   */
  async init({ commit, getters } : any, userData: any) {
    const userKey = userData.id;
    const userId = userData.v3User?.uuid;

    if (!userKey || !userId) {
      console.error('Unable to initialize notifications - required user info not available'); // eslint-disable-line no-console

      return;
    }

    // Notifications are stored under a key for the current user, so set the local storage key based on the user id
    commit('localStorageKey', md5(userKey, 'hex'));
    commit('userId', userId);

    let notifications: StoredNotification[] = [];
    const localStorageKey = getters['localStorageKey'];
    let encryptionKey;

    try {
      encryptionKey = await deriveKey(userId);
    } catch (e) {
      console.error('Unable to generate encryption key for notifications', e); // eslint-disable-line no-console

      return;
    }

    // Store the encryption key
    commit('encryptionKey', encryptionKey);

    // Load the notifications from local storage
    try {
      const data = window.localStorage.getItem(localStorageKey) || '{}';

      notifications = await loadFromString(data, encryptionKey);
    } catch (e) {
      console.error('Unable to read notifications from local storage', e); // eslint-disable-line no-console
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
  }
};
