import { clear, findBy, removeObject } from '@/utils/array';
import { stringify } from '@/utils/error';

const DEFAULT_TIMEOUT = 5000;

export const state = function() {
  return {
    nextId: 1,
    stack:  [],
  };
};

export const mutations = {
  add(state, data) {
    state.stack.push({
      id:      state.nextId++,
      started: (new Date().getTime()),
      ...data
    });
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

  success({ commit }, data) {
    commit('add', {
      color:   'success',
      timeout: DEFAULT_TIMEOUT,
      ...data
    });
  },

  info({ commit }, data) {
    commit('add', {
      color:   'info',
      timeout: DEFAULT_TIMEOUT,
      ...data
    });
  },

  warning({ commit }, data) {
    commit('add', {
      color:   'warning',
      timeout: DEFAULT_TIMEOUT,
      ...data
    });
  },

  error({ commit }, data) {
    commit('add', {
      color:   'error',
      timeout: 0, // Errors don't timeout
      ...data
    });
  },

  fromError({ commit }, { title, err }) {
    commit('add', {
      color:   'error',
      timeout: 0, // Errors don't timeout
      title,
      message: stringify(err),
    });
  }
};
