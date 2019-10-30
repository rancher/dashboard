import { parse as setCookieParser } from 'set-cookie-parser';
import { randomStr } from '@/utils/string';
import { addParams } from '@/utils/url';
import { findBy } from '@/utils/array';

const KEY = 'rc_nonce';
const BASE_SCOPES = ['read:user', 'read:org', 'user:email'];

const ERR_NONCE = 'nonce';
const ERR_CLIENT = 'client';
const ERR_SERVER = 'server';

export const state = function() {
  return {
    loggedIn:  false,
    principal: null,
  };
};

export const getters = {
  loggedIn() {
    return state.loggedIn;
  },

  principalId(state) {
    return state.principalId;
  }
};

export const mutations = {
  loggedInAs(state, principalId) {
    state.loggedIn = true;
    state.principalId = principalId;

    this.$cookies.remove(KEY);
  },

  loggedOut(state) {
    if ( typeof window !== 'undefined' ) {
      window.$nuxt.$disconnect();
    }

    state.loggedIn = false;
    state.principal = null;
  },
};

export const actions = {
  getAuthProviders({ dispatch }) {
    return dispatch('rancher/findAll', {
      type: 'authProvider',
      opt:  { url: `/v3-public/authProviders` }
    }, { root: true });
  },

  async getAuthProvider({ dispatch }, id) {
    const authConfigs = await dispatch('getAuthProviders');

    return findBy(authConfigs, 'id', id);
  },

  async redirectToGithub({ state, commit, dispatch }, opt = {}) {
    const authConfig = await dispatch('getAuthProvider', 'github');

    const nonce = randomStr(16);

    this.$cookies.set(KEY, nonce, {
      path:     '/',
      sameSite: false,
      secure:   true,
    });

    const scopes = BASE_SCOPES.slice();

    if ( opt && opt.scopes ) {
      scopes.push(...opt.scopes);
    }

    if (!opt.route) {
      opt.route = '/auth/verify';
    }

    const url = addParams(authConfig.redirectUrl, {
      scope:        [...BASE_SCOPES, ...scopes].join(','),
      redirect_uri: `${ window.location.origin }${ opt.route }${ (window.location.search || '').includes('spa') ? '?spa' : '' }`,
      state:        nonce
    });

    window.location.href = url;
  },

  verifyGithub({ dispatch }, { nonce, code }) {
    const expect = this.$cookies.get(KEY, { parseJSON: false });

    if ( !expect || expect !== nonce ) {
      return ERR_NONCE;
    }

    return dispatch('login', {
      provider: 'github',
      body:     { code }
    });
  },

  async login({ dispatch }, { provider, body }) {
    const authConfig = await dispatch('getAuthProvider', provider);

    try {
      const res = await authConfig.doAction('login', {
        description:  'Dashboard UI session',
        responseType: 'cookie',
        ttl:          16 * 60 * 60 * 1000,
        ...body
      });

      if ( process.server ) {
        const parsed = setCookieParser(res._headers['set-cookie'] || []);

        for ( const opt of parsed ) {
          const key = opt.name;
          const value = opt.value;

          delete opt.name;
          delete opt.value;

          opt.encode = x => x;
          opt.sameSite = false;

          this.$cookies.set(key, value, opt);
        }
      }

      return true;
    } catch (err) {
      if ( err.response.status >= 400 && err.response.status <= 499 ) {
        return ERR_CLIENT;
      }

      return ERR_SERVER;
    }
  },

  async logout({ dispatch, commit }, clearToken = true) {
    if ( clearToken !== false ) {
      try {
        await dispatch('rancher/request', {
          url:           '/v3/tokens?action=logout',
          method:        'post',
          data:          {},
          headers:       { 'Content-Type': 'application/json' },
          logoutOnError: false,
        }, { root: true });
      } catch (e) {
      }
    }

    commit('loggedOut');
  }
};
