import Vue from 'vue';
import { MANAGEMENT } from '@/config/types';
import { clone } from '@/utils/object';

const definitions = {};

export const create = function(name, def, opt = {}) {
  const parseJSON = opt.parseJSON === true;
  const asCookie = opt.asCookie === true;
  const options = opt.options;

  definitions[name] = {
    def,
    options,
    parseJSON,
    asCookie,
    mangleRead:  opt.mangleRead, // Alter the value read from the API (to match old Rancher expectations)
    mangleWrite: opt.mangleWrite, // Alter the value written back to the API (ditto)
  };

  return name;
};

export const mapPref = function(name) {
  return {
    get() {
      return this.$store.getters['prefs/get'](name);
    },

    set(val) {
      this.$store.dispatch('prefs/set', { key: name, val });
    }
  };
};

// --------------------
const parseJSON = true; // Shortcut for setting it below
const asCookie = true; // Also store as a cookie so that it's available before auth

// Keys must be lowercase and valid dns label (a-z 0-9 -)
export const CLUSTER = create('cluster', '');
export const NAMESPACE_FILTERS = create('ns', [], { parseJSON });
export const EXPANDED_GROUPS = create('open-groups', ['cluster'], { parseJSON });
export const FAVORITE_TYPES = create('fav-type', ['secret', 'configmap', 'service', 'persistentvolume'], { parseJSON });
export const RECENT_TYPES = create('recent-type', ['serviceaccount'], { parseJSON });
export const GROUP_RESOURCES = create('group-by', 'namespace');
export const DIFF = create('diff', 'unified', { options: ['unified', 'split'] });
export const THEME = create('theme', 'dark', {
  options:     ['light', 'auto', 'dark'],
  asCookie,
  parseJSON,
  mangleRead:  x => x.replace(/^ui-/, ''),
  mangleWrite: x => `ui-${ x }`,
});
export const LOCALE = create('locale', 'en-us', { asCookie });
export const KEYMAP = create('keymap', 'sublime', { options: ['sublime', 'emacs', 'vim'] });
export const ROWS_PER_PAGE = create('per-page', 100, { options: [10, 25, 50, 100, 250, 500, 1000], parseJSON });

export const DATE_FORMAT = create('date-format', 'ddd, MMM D YYYY', {
  options: [
    'ddd, MMM D YYYY',
    'ddd, D MMM YYYY',
    'D/M/YYYY',
    'M/D/YYYY',
    'YYYY-MM-DD'
  ]
});

export const TIME_FORMAT = create('time-format', 'h:mm:ss a', {
  options: [
    'h:mm:ss a',
    'HH:mm:ss'
  ]
});

export const TIME_ZONE = create('time-zone', 'local');
export const DEV = create('dev', false, { parseJSON });

// --------------------

const cookiePrefix = 'R_';
const cookieOptions = {
  maxAge:   365 * 86400,
  path:     '/',
  sameSite: true,
  secure:   true,
};

export const state = function() {
  return {};
};

export const getters = {
  get: state => (key) => {
    const definition = definitions[key];

    if (!definition) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    const user = state[key];

    if (user !== undefined) {
      return clone(user);
    }

    const def = clone(definition.def);

    return def;
  },

  defaultValue: state => (key) => {
    const definition = definitions[key];

    if (!definition) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    return clone(definition.def);
  },

  options: state => (key) => {
    const definition = definitions[key];

    if (!definition) {
      throw new Error(`Unknown preference: ${ key }`);
    }

    if (!definition.options) {
      throw new Error(`Preference does not have options: ${ key }`);
    }

    return definition.options.slice();
  }
};

export const mutations = {
  load(state, { key, val }) {
    Vue.set(state, key, val);
  },
};

export const actions = {
  async set({ dispatch, commit }, opt) {
    const { key, value } = opt;
    let { val } = opt;

    if ( value ) {
      throw new Error('Use "val" instead of "value" for setting preference');
    }

    const definition = definitions[key];
    const server = await dispatch('loadServer', key); // There's no watch on prefs, so get before set...

    commit('load', { key, val });

    if ( definition.asCookie ) {
      const opt = { ...cookieOptions, parseJSON: definition.parseJSON === true };

      this.$cookies.set(`${ cookiePrefix }${ key }`.toUpperCase(), val, opt);
    }

    if ( server?.data ) {
      if ( definition.mangleWrite ) {
        val = definition.mangleWrite(val);
      }

      if ( definition.parseJSON ) {
        Vue.set(server.data, key, JSON.stringify(val));
      } else {
        Vue.set(server.data, key, val);
      }

      server.save();
    }
  },

  loadCookies({ commit }) {
    for (const key in definitions) {
      const definition = definitions[key];

      if ( !definition.asCookie ) {
        continue;
      }

      const opt = { parseJSON: definition.parseJSON === true };
      const val = this.$cookies.get(`${ cookiePrefix }${ key }`.toUpperCase(), opt);

      if (val !== undefined) {
        commit('load', { key, val });
      }
    }
  },

  async loadServer({ dispatch, commit }, ignoreKey) {
    const all = await dispatch('management/findAll', {
      type: MANAGEMENT.PREFERENCE,
      opt:  {
        url:   'userpreferences',
        force: true,
        watch: false
      }
    }, { root: true });

    const server = all?.[0];

    if ( !server?.data ) {
      return;
    }

    for (const key in definitions) {
      const definition = definitions[key];
      let val = clone(server.data[key]);

      if ( val === undefined || key === ignoreKey) {
        continue;
      }

      if ( definition.parseJSON ) {
        try {
          val = JSON.parse(val);
        } catch (err) {
          console.error('Error parsing server pref', key, val, err);
          continue;
        }
      }

      if ( definition.mangleRead ) {
        val = definition.mangleRead(val);
      }

      commit('load', { key, val });
    }

    return server;
  }
};
