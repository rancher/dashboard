import Vue from 'vue';

const all = {};

export const create = function(name, def, parseJSON = false) {
  all[name] = {
    def,
    parseJSON
  };

  return name;
};

// --------------------

export const NAMESPACES = create('ns', [], true);
export const EXPANDED_GROUPS = create('open_groups', [], true);
export const GROUP_RESOURCES = create('group_by', 'namespace');
export const THEME = create('theme', 'dark');
export const ROWS_PER_PAGE = create('per_page', 100);
export const DATE_FORMAT = create('date_format', 'ddd, MMM D, Y');
export const TIME_FORMAT = create('time_format', 'h:mm:ss a');
export const TIME_ZONE = create('time_zone', 'local');

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
  get: state => (key) => {
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
      const opt = { parseJSON: entry.parseJSON !== false };

      const val = this.$cookies.get(`${ prefix }${ key }`, opt);

      if (val !== undefined) {
        commit('load', { key, val });
      }
    }
  }
};
