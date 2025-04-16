import { randomStr } from '@shell/utils/string';

const LOCAL_STORAGE_KEY = '#notifications';

// Expire in seconds (14 days)
const EXPIRY = 14 * 24 * 60 * 60;

// Maximum number of notifications that are allowed
const MAX_NOTIFICATIONS = 50;

/**
 * Store for the UI Notification Centre
 */

export type NotificationAction = {
  label: string; // Button label for the action
  target?: string; // HREF target when the button is clicked
};

export type NotificationPreference = {
  key: string; // User preference key to use when setting the preference when the notification is marked as read
  value: string; // User preference value to use when setting the preference when the notification is marked as read
};

export enum NotificationLevel {
  Announcement = 0, // eslint-disable-line no-unused-vars
  Task, // eslint-disable-line no-unused-vars
  Info, // eslint-disable-line no-unused-vars
  Success, // eslint-disable-line no-unused-vars
  Warning, // eslint-disable-line no-unused-vars
  Error, // eslint-disable-line no-unused-vars
}

/**
 * Type for Notification that is sent
 */
export type Notification = {
  // Unique ID for the notification
  id: string;
  title: string;
  message?: string;
  level: NotificationLevel;
  progress?: number;
  primaryAction?: NotificationAction;
  secondaryAction?: NotificationAction;
  preference?: NotificationPreference;
}

/**
 * Type for notification that is stored
 *
 * Includes extra fields managed by the notification center
 */
export type StoredNotification = {
  created: Date;
  read: Boolean;
} & Notification;

// Notifications store state
interface NotificationsStore {
  notifications: StoredNotification[],
}

function persist(state: NotificationsStore) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.notifications));
}

export const state = function(a: any): NotificationsStore {
  let notifications = [];

  try {
    notifications = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
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

  return { notifications };
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

  // Go through all of the unread items and find the best level that represents the most severe unread item(s)
  // Returns -1 if no unread items
  unreadLevel: (state: NotificationsStore) => {
    return state.notifications.reduce((acc, value) => {
      if (!value.read && value.level > acc) {
        return value.level;
      }

      return acc;
    }, -1);
  },
};

export const mutations = {
  add(state: NotificationsStore, notification: Notification) {
    if (!notification.id) {
      notification.id = randomStr();
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

  markAllRead(state: NotificationsStore) {
    state.notifications.forEach((notification) => {
      if (!notification.read) {
        notification.read = true;
      }
    });

    persist(state);
  },

  update(state: NotificationsStore, notification: Notification) {
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
    // state.notifications.unshift(notification);
    state.notifications = notifications;

    // Sort the notifications by created date so that this one appears in the correct place
    // TODO
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

  init({ commit } : any) {
    window.addEventListener('storage', (ev) => {
      if (ev.key === LOCAL_STORAGE_KEY) {
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
