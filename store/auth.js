import { randomStr } from '@/utils/string';
import { addParams } from '@/utils/query-params';

const KEY = 'rc_nonce';
const BASE_SCOPES = ['read:user', 'read:org', 'user:email'];

const ERR_NONCE = 'nonce';
const ERR_CLIENT = 'client';
const ERR_SERVER = 'server';

export const state = function() {
  return {
    loggedIn:    false,
    principal: null,
  };
};

export const getters = {
  loggedIn() {
    return state.loggedIn;
  },

  principal(state) {
    return state.principal;
  }
};

export const mutations = {
  loggedInAs(state, principal) {
    console.log('loggedInAs', principal);
    state.loggedIn = true;
    state.principal = principal;

    if ( typeof window !== 'undefined' && window.sessionStorage ) {
      window.sessionStorage.removeItem(KEY);
    }
  },

  loggedOut(state) {
    window.$nuxt.$disconnect();
    state.loggedIn = false;
    state.principal = null;
  },

  setNonce(state) {
    state.nonce = randomStr(16);
    window.sessionStorage.setItem(KEY, state.nonce);
  }
};

export const actions = {
  async getAuthProvider({ dispatch }) {
    const authConfig = await dispatch('rancher/find', {
      type: 'githubProvider',
      id:   'github',
      opt:  { url: '/v3-public/authProviders/github' }
    }, { root: true });

    return authConfig;
  },

  async redirectToGithub({ state, commit, dispatch }, opt) {
    const authConfig = await dispatch('getAuthProvider');

    commit('setNonce');

    const scopes = BASE_SCOPES.slice();

    if ( opt && opt.scopes ) {
      scopes.push(...opt.scopes);
    }

    const nonce = window.sessionStorage.getItem(KEY);

    const url = addParams(authConfig.redirectUrl, {
      scope:        [...BASE_SCOPES, ...scopes].join(','),
      redirect_uri: `${ window.location.origin }/auth/verify`,
      state:        nonce
    });

    window.location.href = url;
  },

  async verify({ state, commit, dispatch }, { nonce, code }) {
    const expect = window.sessionStorage.getItem(KEY);

    if ( !expect || expect !== nonce ) {
      return ERR_NONCE;
    }

    const authConfig = await dispatch('getAuthProvider');

    try {
      await authConfig.doAction('login', {
        code,
        description:  'Dashboard UI session',
        responseType: 'cookie',
        ttl:          16 * 60 * 60 * 1000,
      });

      return true;
    } catch (err) {
      if ( err.response.status >= 400 && err.response.status <= 499 ) {
        return ERR_CLIENT;
      }

      return ERR_SERVER;
    }
  },

  async logout({ dispatch, commit }) {
    try {
      await dispatch('rancher/request', { url: '/v3/tokens?action=logout', method: 'post' }, { root: true });
    } catch (e) {
    }

    commit('loggedOut');
  }
};
