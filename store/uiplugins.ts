// We already have a 'plugins' store, which is for cluster drivers
// This store is for the instsall UI plugins

// import { addObject, removeObject } from '@/utils/array';

import { allHash } from '@/utils/promise';
import { Plugin } from '~/shell/core/plugin';

interface UIPluginState {
  plugins: Plugin[],
  catalog: any[],
  catalogs: string[],
}

export const state = function(): UIPluginState {
  return {
    plugins:    [],
    catalog:    [],
    catalogs:   [''],
  };
};

export const getters = {
  plugins: (state: any) => {
    return state.plugins;
  },

  catalog: (state: any) => {
    return state.catalog;
  },

  catalogs: (state: any) => {
    return state.catalogs;
  },
};

export const mutations = {
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

  setCatalog(state: UIPluginState, catalog: any) {
    state.catalog = catalog;
  },

  addCatalog(state: UIPluginState, catalog: string) {
    state.catalogs.push(catalog);
  }
};

export const actions = {
  addCatalog( { commit, dispatch }: any, url: string ) {
    commit('addCatalog', url);
  },

  // This is just for PoC - we wouldn't get the catalog from Verdaccio
  // This fetches the catalog each time
  async loadCatalogs( { getters, commit, dispatch }: any) {
    const packages: any[] = [];
    const catalogHash = {} as any;
    const catalogs = getters['catalogs'];

    catalogs.forEach((url: string) => {
      const base = url;

      if (!url) {
        url = '/verdaccio/data/packages';
      } else {
        url = `/uiplugins-catalog/?${ url }`;
      }

      try {
        catalogHash[base] = dispatch('rancher/request', { url }, { root: true });
      } catch (err) {
        // Ignore errors... or all plugins fail
        console.warn('Unable to fetch catalog: ', url, err); // eslint-disable-line no-console
      }
    });

    const res = await allHash(catalogHash);

    Object.keys(res as any).forEach((r: string) => {
      const v: any = (res as any)[r];

      v.forEach((p: any) => {
        p.location = r;
        packages.push(p);
      });
    });

    const uiPackages = packages.filter((pkg: any) => pkg.rancher);

    commit('setCatalog', uiPackages);
  },

  addPlugin({ commit }: any, plugin: Plugin) {
    commit('addPlugin', plugin);
  },

  removePlugin({ commit }: any, pluginName: string) {
    commit('removePlugin', pluginName);
  }
};
