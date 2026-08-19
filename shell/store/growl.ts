import { ActionContext } from 'vuex';
import { clear, findBy, removeObject } from '@shell/utils/array';
import { stringify } from '@shell/utils/error';
import { Notification, NotificationLevel } from '@shell/types/notifications';

const DEFAULT_TIMEOUT = 5000;

const MAX_GROWLS = 5;

/**
 * A growl on the stack, as built by the `add` mutation. `id` and `started` are
 * always set there, everything else comes from the data given to the actions.
 */
export interface Growl {
  id: number;
  /**
   * Epoch ms the growl was added.
   */
  started: number;
  color?: string;
  icon?: string;
  timeout?: number;
  title?: string;
  message?: string;
  notification?: string;
  /**
   * Socket url, used by the steve subscribe plugin to find its own growl again.
   */
  url?: string;
  /**
   * Epoch ms before which the growl should not be closed.
   */
  earliestClose?: number;
}

export type GrowlData = Omit<Growl, 'id' | 'started'>;

export interface GrowlState {
  nextId: number;
  /** Newest first. */
  stack: Growl[];
}

type GrowlContext = ActionContext<GrowlState, any>;

export const state = function(): GrowlState {
  return {
    nextId: 1,
    stack:  [],
  };
};

export const getters = {
  find: (state: GrowlState) => ({ key, val }: { key: string, val: unknown }) => {
    return findBy(state.stack, key, val);
  },

  // findBy is slow, so more efficient getter for id
  byId: (state: GrowlState) => (id: number) => {
    return state.stack.find((item) => item.id === id);
  }
};

export const mutations = {
  add(state: GrowlState, data: GrowlData) {
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

  remove(state: GrowlState, id: number) {
    const obj = findBy(state.stack, 'id', id);

    if ( obj ) {
      removeObject(state.stack, obj);
    }
  },

  clear(state: GrowlState) {
    clear(state.stack);
  }
};

export const actions = {
  clear({ commit }: GrowlContext ) {
    commit('clear');
  },

  remove({ commit }: GrowlContext, id: number ) {
    commit('remove', id);
  },

  async close({ commit, dispatch, getters }: GrowlContext, id: number ) {
    const growl = getters.byId(id);

    commit('remove', id);

    // If the growl has a notification, mark it as read if the user dismisses the growl
    if (growl.notification) {
      await dispatch('notifications/markRead', growl.notification, { root: true });
    }
  },

  async success({ commit, dispatch }: GrowlContext, data: GrowlData) {
    // Send a notification for the growl
    const notification: string = await dispatch('notifications/fromGrowl', {
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

  info({ commit }: GrowlContext, data: GrowlData) {
    commit('add', {
      color:   'info',
      icon:    'info',
      timeout: DEFAULT_TIMEOUT,
      ...data
    });
  },

  async warning({ commit, dispatch }: GrowlContext, data: GrowlData) {
    // Send a notification for the growl
    const notification: string = await dispatch('notifications/fromGrowl', {
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

  async error({ commit, dispatch }: GrowlContext, data: GrowlData) {
    // Send a notification for the growl
    const notification: string = await dispatch('notifications/fromGrowl', {
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

  async fromError({ commit, dispatch }: GrowlContext, { title, err }: { title?: string, err?: unknown }) {
    // Send a notification for the growl
    const notification: string = await dispatch('notifications/fromGrowl', {
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
  notification({ commit }: GrowlContext, notification: Notification) {
    const growl: GrowlData & {
      skip?: boolean;
    } = {
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
