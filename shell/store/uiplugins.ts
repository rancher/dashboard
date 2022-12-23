// We already have a 'plugins' store, which is for cluster drivers
// This store is for the instsall UI plugins

// import { addObject, removeObject } from '@shell/utils/array';

import { Plugin } from '@shell/core/plugin';

interface UIPluginState {
  plugins: Plugin[],
  uiConfig: any,
  errors: any,
}

interface LoadError {
  name: string,
  error: boolean,
}

export const state = function(): UIPluginState {
  return {
    uiConfig: null,
    plugins:  [],
    errors:   {},
  };
};

export const getters = {
  uiConfig: (state: any) => {
    return state.uiConfig;
  },

  plugins: (state: any) => {
    return state.plugins;
  },

  errors: (state: any) => {
    return state.errors;
  },
};

export const mutations = {
  setError(state: UIPluginState, error: LoadError) {
    state.errors[error.name] = error.error;
  },

  addPluginsUiConfig(state: UIPluginState, uiConfig: any) {
    state.uiConfig = uiConfig;
  },

  addPlugin(state: UIPluginState, plugin: Plugin) {
    // TODO: Duplicates?
    state.plugins.push(plugin);
  },

  removePlugin(state: UIPluginState, pluginName: string) {
    const index = state.plugins.findIndex(p => p.name === pluginName);

    if (index !== -1) {
      state.plugins.splice(index, 1);
    }
  },
};

export const actions = {
  setError( { commit }: any, error: LoadError ) {
    commit('setError', error);
  },

  addPluginsUiConfig({ commit }: any, uiConfig: any) {
    commit('addPluginsUiConfig', uiConfig);
  },

  addPlugin({ commit }: any, plugin: Plugin) {
    commit('addPlugin', plugin);
  },

  removePlugin({ commit }: any, pluginName: string) {
    commit('removePlugin', pluginName);
  }
};
