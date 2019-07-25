import Vue from 'vue';
import * as Cookies from 'js-cookie';

// If you add a new one you must add a value to "defaults" below
export const FAVORITES = 'fav';
export const THEME = 'theme';
// If you add a new one you must add a value to "defaults" below

const defaults = () => {
  return {
    [THEME]:     'dark',
    [FAVORITES]: [
      'api/nodes',
      'api/services',
      'apps/daemonsets',
      'apps/deployments',
      'apps/statefulsets',
    ],
    foo: ''
  };
};

const prefix = 'rd_';
const options = {
  expires: 365,
  path:    '/',
  secure:  window.location.protocol === 'https:',
};

export const state = () => {
  const out = defaults();

  for (const k in out) {
    const val = Cookies.get(`${ prefix }${ k }`);

    if (val !== undefined) {
      out[k] = val;
    }
  }

  return out;
};

export const mutations = {
  set(state, { key, val }) {
    Cookies.set(`${ prefix }${ key }`, val, options);
    Vue.set(state, key, val);
  },
};
