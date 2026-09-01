/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// We already have a 'plugins' store, which is for cluster drivers
// This store is for the instsall UI plugins

// import { addObject, removeObject } from '@shell/utils/array';

import { Plugin } from '@shell/core/plugin';

interface UIPluginState {
  plugins: Plugin[],
  errors: any,
  ready: boolean,
}

interface LoadError {
  name: string,
  error: boolean,
}

export const state = function(): UIPluginState {
  return {
    plugins: [],
    errors:  {},
    ready:   false,
  };
};

export const getters = {
  plugins: (state: any) => {
    return state.plugins;
  },

  errors: (state: any) => {
    return state.errors;
  },

  ready: (state: any) => {
    return state.ready;
  },
};

export const mutations = {
  setError(state: UIPluginState, error: LoadError) {
    state.errors[error.name] = error.error;
  },

  addPlugin(state: UIPluginState, plugin: Plugin) {
    // TODO: Duplicates?
    state.plugins.push(plugin);
  },

  removePlugin(state: UIPluginState, pluginName: string) {
    const index = state.plugins.findIndex((p) => p.name === pluginName);

    if (index !== -1) {
      state.plugins.splice(index, 1);
    }
  },

  setReady(state: UIPluginState, ready: boolean) {
    state.ready = ready;
  },
};

export const actions = {
  setError( { commit }: any, error: LoadError ) {
    commit('setError', error);
  },

  addPlugin({ commit }: any, plugin: Plugin) {
    commit('addPlugin', plugin);
  },

  removePlugin({ commit }: any, pluginName: string) {
    commit('removePlugin', pluginName);
  },

  setReady( { commit }: any, ready: boolean ) {
    commit('setReady', ready);
  },
};
