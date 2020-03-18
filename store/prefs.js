import Vue from 'vue';

const all = {};

export const create = function(name, def, opt = {}) {
  const parseJSON = opt.parseJSON === true;
  const options = opt.options;

  all[name] = {
    def,
    options,
    parseJSON
  };

  return name;
};

export const mapPref = function(name) {
  return {
    get() {
      return this.$store.getters['prefs/get'](name);
    },

    set(val) {
      this.$store.commit('prefs/set', { key: name, val });
    }
  };
};

// --------------------
const parseJSON = true; // Shortcut for setting it below

export const CLUSTER = create('cluster', 'local'); // @TODO remember last cluster, handle if missing, combine with namespacess
export const NAMESPACE_FILTERS = create('ns', [], { parseJSON });
export const EXPANDED_GROUPS = create('open_groups', ['rio'], { parseJSON });
export const FAVORITE_TYPES = create('fav_type', ['secret', 'configmap', 'service', 'persistentvolume'], { parseJSON });
export const RECENT_TYPES = create('recent_type', ['serviceaccount'], { parseJSON });
export const GROUP_RESOURCES = create('group_by', 'namespace');
export const DIFF = create('diff', 'unified', { options: ['unified', 'split'] });
export const THEME = create('theme', 'dark', { options: ['light', 'dark'] });
export const KEYMAP = create('keymap', 'sublime', { options: ['sublime', 'emacs', 'vim'] });
export const ROWS_PER_PAGE = create('per_page', 100);
export const DATE_FORMAT = create('date_format', 'ddd, MMM D YYYY');
export const TIME_FORMAT = create('time_format', 'h:mm:ss a');
export const TIME_ZONE = create('time_zone', 'local');
export const DEV = create('dev', false, { parseJSON });

// --------------------

const prefix = 'rd_';
const options = {
  maxAge:   365 * 86400,
  path:     '/',
  sameSite: false,
  secure:   true,
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
  },

  options: state => (key) => {
    const entry = all[key];

    if (!entry) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    if (!entry.options) {
      throw new Error(`Preference does not have options: ${ key }`);
    }

    return entry.options.slice();
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

      const opt = { parseJSON: entry.parseJSON === true };

      const val = this.$cookies.get(`${ prefix }${ key }`, opt);

      if (val !== undefined) {
        commit('load', { key, val });
      }
    }
  }
};
