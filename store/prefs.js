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

export const ROWS_PER_PAGE = create('per_page', 100, false);

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

export const getters = {
  getPref: state => (key) => {
    const entry = all[key];

    if (!entry) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    const user = state[key];

    if (user) {
      return user;
    }

    const def = JSON.parse(JSON.stringify(entry.def));

    return def;
  }
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
      const opt = {};

      if (!entry.isJson) {
        opt.parseJSON = false;
      }

      const val = this.$cookies.get(`${ prefix }${ key }`, opt);

      if (val !== undefined) {
        commit('load', { key, val });
      }
    }
  }
};
