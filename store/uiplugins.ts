// We already have a 'plugins' store, which is for cluster drivers
// This store is for the instsall UI plugins

// import { addObject, removeObject } from '@/utils/array';

import { PluginMetadata } from '~/shell/core/plugin';

interface UIPluginState {
  plugins: PluginMetadata[],
  catalog: any[],
}

export const state = function() {
  return {
    plugins:    [],
    catalog:    [],
  } as UIPluginState;
};

export const getters = {
  plugins: (state: any) => {
    return state.plugins;
  },

  catalog: (state: any) => {
    return state.catalog;
  },
};

export const mutations = {
  addPlugin(state: UIPluginState, plugin: PluginMetadata) {
    // TODO: Duplicates?
    state.plugins.push(plugin);
  },

  removePlugin(state: UIPluginState, plugin: PluginMetadata) {
    const index = state.plugins.findIndex(p => p.name === plugin.name);

    // TODO: PluginMetadata is not the correct object type

    if (index !== -1) {
      state.plugins.splice(index, 1);
    }
  },

  setCatalog(state: UIPluginState, catalog: any) {
    state.catalog = catalog;
  }
};

export const actions = {
  // This is just for PoC - we woudln't get the catalog from Verdaccio
  // This fetches the catalog each time
  async loadCatalog( { commit, dispatch }: any ) {
    const url = '/verdaccio/packages';
    const res = await dispatch('rancher/request', { url }, { root: true });
    // Filter the ones that are UI Packages
    const uiPackages = res.filter((pkg: any) => pkg.rancher);

    commit('setCatalog', uiPackages);
  },

  addPlugin({ commit }: any, plugin: PluginMetadata) {
    commit('addPlugin', plugin);
  },

  removePlugin({ commit }: any, plugin: PluginMetadata) {
    commit('removePlugin', plugin);
  }
};
