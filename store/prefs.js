import Vue from 'vue';

const all = {};

export const create = function(name, def, json = true) {
  all[name] = {
    def,
    isJson: json
  };

  return name;
};

// --------------------

export const FAVORITES = create('fav', [
  'api/nodes',
  'api/services',
  'apps/daemonsets',
  'apps/deployments',
  'apps/statefulsets',
], true);

export const THEME = create('theme', 'dark', false);

// --------------------

const prefix = 'rd_';
const options = {
  maxAge:   365 * 86400,
  path:     '/',
  sameSite: true,
  secure:   true, // window.location.protocol === 'https:',
};

export const state = function() {
  return {};
};

export const mutations = {
  load(state, { key, val }) {
    Vue.set(state, key, val);
  },

  set(state, { key, val }) {
    this.$cookies.set(`${ prefix }${ key }`, val, options);
    Vue.set(state, key, val);
  },
};

export const actions = {
  loadCookies({ commit }) {
    for (const key in all) {
      const entry = all[key];
      let val = JSON.parse(JSON.stringify(entry.def));
      const opt = {};

      if (!entry.isJson) {
        opt.parseJSON = false;
      }

      const user = this.$cookies.get(`${ prefix }${ key }`, opt);

      if (user !== undefined) {
        val = user;
      }

      commit('load', { key, val });
    }
  }
};
