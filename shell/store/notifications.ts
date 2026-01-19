import { md5 } from '@shell/utils/crypto';
import { randomStr } from '@shell/utils/string';
import {
  EncryptedNotification,
  Notification,
  NotificationLevel,
  NotificationHandlerExtensionName,
  StoredNotification
} from '@shell/types/notifications';
import { encrypt, decrypt, deriveKey } from '@shell/utils/crypto/encryption';

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
 * Broadcast channel name to send changes across tabs
 */
const NOTIFICATION_CHANNEL_NAME = 'rancher-notification-sync';

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

let bc: BroadcastChannel;

/**
 * Sync notifications to other tabs using the broadcast channel. Send the user id, to cover corner case
 * where a stale login exists for a different user in another tab.
 */
function sync(userId: string, operation: string, param?: any) {
  bc?.postMessage({
    userId,
    operation,
    param
  });
}

async function saveEncryptedNotification(getters: any, notification: Notification) {
  const toEncrypt: EncryptedNotification = {
    title:           notification.title,
    message:         notification.message,
    level:           notification.level,
    primaryAction:   notification.primaryAction,
    secondaryAction: notification.secondaryAction,
    preference:      notification.preference,
    handlerName:     notification.handlerName,
    data:            notification.data,
  };

  const localStorageKey = getters['localStorageKey'];
  const encryptionKey = getters['encryptionKey'];

  try {
    const data = JSON.stringify(toEncrypt);
    const enc = await encrypt(data, encryptionKey);

    window.localStorage.setItem(`${ localStorageKey }-${ notification.id }`, JSON.stringify(enc));
  } catch (e) {
    console.error('Unable to save notification to local storage', e); // eslint-disable-line no-console
  }
}

/**
 * Sync the notifications index to local storage.
 *
 * We only store the non-sensitive data about the notifications in the index - the other data is stored in individual entries which are encrypted.
 */
function syncIndex(state: NotificationsStore) {
  const localStorageKey = state.localStorageKey;

  // We just want the id, created, read and progress properties for the index
  const index = state.notifications.map((n) => ({
    id:       n.id,
    created:  n.created,
    read:     n.read,
    progress: n.progress,
  }));

  try {
    window.localStorage.setItem(localStorageKey, JSON.stringify(index));
  } catch (e) {
    console.error('Unable to save notifications index to local storage', e); // eslint-disable-line no-console
  }
}

export const getters = {
  all: (state: NotificationsStore) => {
    return state.notifications;
  },

  visible: (state: NotificationsStore) => {
    return state.notifications.filter((n) => n.level !== NotificationLevel.Hidden);
  },

  hidden: (state: NotificationsStore) => {
    return state.notifications.filter((n) => n.level === NotificationLevel.Hidden);
  },

  item: (state: NotificationsStore) => {
    return (id: string) => {
      return state.notifications.find((i) => i.id === id);
    };
  },

  // Count of unread notifications - only considers visible notifications
  unreadCount: (state: NotificationsStore) => {
    return state.notifications.filter((n) => !n.read && n.level !== NotificationLevel.Hidden).length;
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
      const removed = state.notifications.pop();

      if (removed) {
        // Remove the encrypted data for the notification that we just removed
        window.localStorage.removeItem(`${ state.localStorageKey }-${ removed.id }`);
      }
    }

    syncIndex(state);
  },

  markRead(state: NotificationsStore, id: string) {
    const notification = state.notifications.find((n) => n.id === id);

    if (notification && !notification.read) {
      notification.read = true;
    }

    syncIndex(state);
  },

  markUnread(state: NotificationsStore, id: string) {
    const notification = state.notifications.find((n) => n.id === id);

    if (notification && notification.read) {
      notification.read = false;
    }

    syncIndex(state);
  },

  // Only mark visible notifications as read via mark all
  markAllRead(state: NotificationsStore) {
    state.notifications.forEach((notification) => {
      if (!notification.read && notification.level !== NotificationLevel.Hidden) {
        notification.read = true;
      }
    });

    syncIndex(state);
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

    syncIndex(state);
  },

  clearAll(state: NotificationsStore) {
    // Remove the encrypted data for each notification
    state.notifications.forEach((n) => {
      window.localStorage.removeItem(`${ state.localStorageKey }-${ n.id }`);
    });

    state.notifications = [];
    syncIndex(state);
  },

  remove(state: NotificationsStore, id: string) {
    // Remove the encrypted data for the notification
    window.localStorage.removeItem(`${ state.localStorageKey }-${ id }`);

    state.notifications = state.notifications.filter((n) => n.id !== id);
    syncIndex(state);
  },

  load(state: NotificationsStore, notifications: StoredNotification[]) {
    state.notifications = notifications;
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

async function callNotifyHandler({ $extension }: any, notification: Notification, read: boolean) {
  if (notification?.handlerName) {
    const handler = $extension.getDynamic(NotificationHandlerExtensionName, notification.handlerName);

    if (handler) {
      try {
        await handler.onReadUpdated(notification, read);
      } catch (e) {
        console.error('Error invoking notification handler', e); // eslint-disable-line no-console
      }
    }
  }
}

export const actions = {
  async add( { commit, dispatch, getters }: any, notification: Notification) {
    // We encrypt the notification on add - this is the only time we will encrypt it
    if (!notification.id) {
      notification.id = randomStr();
    }

    // Need to save the encrypted notification to local storage
    await saveEncryptedNotification(getters, notification);

    commit('add', notification);
    sync(getters['userId'], 'add', notification);

    // Show a growl for the notification if necessary
    dispatch('growl/notification', notification, { root: true });

    return notification.id;
  },

  async fromGrowl( { commit, getters }: any, notification: Notification) {
    notification.id = randomStr();

    // Need to save the encrypted notification to local storage
    await saveEncryptedNotification(getters, notification);

    commit('add', notification);
    sync(getters['userId'], 'add', notification);

    return notification.id;
  },

  update({ commit, getters }: any, notification: Notification) {
    commit('update', notification);
    sync(getters['userId'], 'update', notification);
  },

  async markRead({ commit, dispatch, getters }: any, id: string) {
    commit('markRead', id);
    sync(getters['userId'], 'markRead', id);

    const notification = getters.item(id);

    if (notification?.preference) {
      await dispatch('prefs/set', notification.preference, { root: true });
    }

    if (notification?.handlerName) {
      await callNotifyHandler({ $extension: (this as any).$extension }, notification, true);
    }
  },

  async markUnread({ commit, dispatch, getters }: any, id: string) {
    commit('markUnread', id);
    sync(getters['userId'], 'markUnread', id);

    const notification = getters.item(id) as Notification;

    if (notification?.preference) {
      await dispatch('prefs/set', {
        key:   notification.preference.key,
        value: notification.preference.unsetValue || '',
      }, { root: true });
    }

    if (notification?.handlerName) {
      await callNotifyHandler({ $extension: (this as any).$extension }, notification, false);
    }
  },

  async markAllRead({ commit, dispatch, getters }: any) {
    commit('markAllRead');
    sync(getters['userId'], 'markAllRead');

    // For all notifications that have a preference, set the preference, since they are now read
    const withPreference = getters.all.filter((n: Notification) => !!n.preference);

    for (let i = 0; i < withPreference.length; i++) {
      await dispatch('prefs/set', withPreference[i].preference, { root: true });
    }

    // For all notifications that have a handler, call the handler
    const withHandler = getters.all.filter((n: Notification) => !!n.handlerName);

    for (let i = 0; i < withHandler.length; i++) {
      await callNotifyHandler({ $extension: (this as any).$extension }, withHandler[i], true);
    }
  },

  remove({ commit, getters }: any, id: string) {
    commit('remove', id);
    sync(getters['userId'], 'remove', id);
  },

  clearAll({ commit, getters }: any) {
    commit('clearAll');
    sync(getters['userId'], 'clearAll');
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

    let index: StoredNotification[] = [];
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
    // We store the index of notifications in local storage, and the actual notification data is stored in individual entries which are encrypted
    try {
      const data = window.localStorage.getItem(localStorageKey) || '[]';

      index = JSON.parse(data) as StoredNotification[];
    } catch (e) {
      console.error('Unable to read notifications from local storage', e); // eslint-disable-line no-console
    }

    for (let i = 0; i < index.length; i++) {
      const n = index[i];

      try {
        const data = window.localStorage.getItem(`${ localStorageKey }-${ n.id }`);
        const parsedData = data ? JSON.parse(data) : '{}';
        const decryptedString = await decrypt(parsedData, encryptionKey);
        const decrypted = JSON.parse(decryptedString) as EncryptedNotification;

        // Overlay the decrypted data onto the notification
        notifications.push({
          ...n,
          ...decrypted
        });
      } catch (e) {
        console.error('Unable to decrypt notification data', e); // eslint-disable-line no-console
      }
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

    // Set up broadcast listener to listen for updates from other tabs
    bc = new BroadcastChannel(NOTIFICATION_CHANNEL_NAME);

    bc.onmessage = (msgEvent: any) => {
      // Ignore events where the user id does not match (corner case of stale login in another tab)
      if (msgEvent?.data?.operation && msgEvent?.data?.userId === userId) {
        commit(msgEvent.data.operation, msgEvent.data.param);
      }
    };
  }
};
