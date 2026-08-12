import { clear, findBy, removeObject } from '@shell/utils/array';
import { stringify } from '@shell/utils/error';
import { NotificationLevel } from '@shell/types/notifications';

const DEFAULT_TIMEOUT = 5000;

const MAX_GROWLS = 5;

/**
 * A growl on the stack, as built by the `add` mutation. `id` and `started` are
 * always set there, everything else comes from the data given to the actions.
 *
 * @typedef {object} Growl
 * @property {number} id - Incrementing id, unique within the stack.
 * @property {number} started - Epoch ms the growl was added.
 * @property {string} [color]
 * @property {string} [icon]
 * @property {number} [timeout]
 * @property {string} [title]
 * @property {string} [message]
 * @property {string} [notification] - Id of the notification the growl came from.
 * @property {string} [url] - Socket url, used by the steve subscribe plugin to find its own growl again.
 * @property {number} [earliestClose] - Epoch ms before which the growl should not be closed.
 */

/**
 * @typedef {object} GrowlState
 * @property {number} nextId - Id the next added growl will get.
 * @property {Growl[]} stack - Growls currently showing, newest first.
 */

/**
 * @returns {GrowlState}
 */
export const state = function() {
  return {
    nextId: 1,
    stack:  [],
  };
};

export const getters = {
  find: (state) => ({ key, val }) => {
    return findBy(state.stack, key, val);
  },

  // findBy is slow, so more efficient getter for id
  byId: (state) => (id) => {
    return state.stack.find((item) => item.id === id);
  }
};

export const mutations = {
  add(state, data) {
    if (state.stack.length === MAX_GROWLS) {
      // Remove the last one
      state.stack.pop();
    }

    state.stack = [
      {
        id:      state.nextId++,
        started: (new Date().getTime()),
        ...data
      },
      ...state.stack
    ];
  },

  remove(state, id) {
    const obj = findBy(state.stack, 'id', id);

    if ( obj ) {
      removeObject(state.stack, obj);
    }
  },

  clear(state) {
    clear(state.stack);
  }
};

export const actions = {
  clear({ commit } ) {
    commit('clear');
  },

  remove({ commit }, id ) {
    commit('remove', id);
  },

  async close({ commit, dispatch, getters }, id ) {
    const growl = getters.byId(id);

    commit('remove', id);

    // If the growl has a notification, mark it as read if the user dismisses the growl
    if (growl.notification) {
      await dispatch('notifications/markRead', growl.notification, { root: true });
    }
  },

  async success({ commit, dispatch }, data) {
    // Send a notification for the growl
    const notification = await dispatch('notifications/fromGrowl', {
      ...data,
      level: NotificationLevel.Success
    }, { root: true });

    commit('add', {
      color:   'success',
      icon:    'checkmark',
      timeout: DEFAULT_TIMEOUT,
      notification,
      ...data
    });
  },

  info({ commit }, data) {
    commit('add', {
      color:   'info',
      icon:    'info',
      timeout: DEFAULT_TIMEOUT,
      ...data
    });
  },

  async warning({ commit, dispatch }, data) {
    // Send a notification for the growl
    const notification = await dispatch('notifications/fromGrowl', {
      ...data,
      level: NotificationLevel.Warning
    }, { root: true });

    commit('add', {
      color:   'warning',
      icon:    'warning',
      timeout: DEFAULT_TIMEOUT,
      notification,
      ...data
    });
  },

  async error({ commit, dispatch }, data) {
    // Send a notification for the growl
    const notification = await dispatch('notifications/fromGrowl', {
      ...data,
      level: NotificationLevel.Error
    }, { root: true });

    commit('add', {
      color:   'error',
      icon:    'error',
      timeout: DEFAULT_TIMEOUT, // Errors timeout since they will be available as a notification
      notification,
      ...data
    });
  },

  async fromError({ commit, dispatch }, { title, err }) {
    // Send a notification for the growl
    const notification = await dispatch('notifications/fromGrowl', {
      title,
      message: stringify(err),
      level:   NotificationLevel.Error
    }, { root: true });

    commit('add', {
      color:   'error',
      icon:    'error',
      timeout: DEFAULT_TIMEOUT, // Errors timeout since they will be available as a notification
      notification,
      title,
      message: stringify(err),
    });
  },

  /**
   * Used to create a growl when a notification is sent
   *
   * Growls are only shown for Success, Warning and Error notifications
   */
  notification({ commit }, notification) {
    const growl = {
      title:        notification.title,
      message:      notification.message,
      notification: notification.id,
      timeout:      DEFAULT_TIMEOUT,
    };

    switch (notification.level) {
    case NotificationLevel.Success:
      growl.color = 'success';
      growl.icon = 'checkmark';
      break;
    case NotificationLevel.Warning:
      growl.color = 'warning';
      growl.icon = 'warning';
      break;
    case NotificationLevel.Error:
      growl.color = 'error';
      growl.icon = 'error';
      break;
    default:
      growl.skip = true;
    }

    // We don't show growls for info, announcement, task
    if (!growl.skip) {
      commit('add', growl);
    }
  }
};
