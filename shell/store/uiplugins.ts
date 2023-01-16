// We already have a 'plugins' store, which is for cluster drivers
// This store is for the instsall UI plugins

// import { addObject, removeObject } from '@shell/utils/array';

import { Plugin } from '@shell/core/plugin';

interface UIPluginState {
  plugins: Plugin[],
  errors: any,
}

interface LoadError {
  name: string,
  error: boolean,
}

export const state = function(): UIPluginState {
  return {
    plugins: [],
    errors:  {},
  };
};

export const getters = {
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

  addPlugin({ commit }: any, plugin: Plugin) {
    commit('addPlugin', plugin);
  },

  removePlugin({ commit }: any, pluginName: string) {
    commit('removePlugin', pluginName);
  }
};
