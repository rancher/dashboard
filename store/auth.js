import { parse as setCookieParser } from 'set-cookie-parser';
import { randomStr } from '@/utils/string';
import { addParams } from '@/utils/url';

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

  principal(state) {
    return state.principal;
  }
};

export const mutations = {
  loggedInAs(state, principal) {
    state.loggedIn = true;
    state.principal = principal;

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
  async getAuthProvider({ dispatch }) {
    const authConfig = await dispatch('rancher/find', {
      type: 'githubProvider',
      id:   'github',
      opt:  { url: '/v3-public/authProviders/github' }
    }, { root: true });

    return authConfig;
  },

  async redirectToGithub({ state, commit, dispatch }, opt = {}) {
    const authConfig = await dispatch('getAuthProvider');

    const nonce = randomStr(16);

    this.$cookies.set(KEY, nonce, {
      path:     '/',
      sameSite: true,
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

  async verify({ state, commit, dispatch }, { nonce, code }) {
    const expect = this.$cookies.get(KEY, { parseJSON: false });

    if ( !expect || expect !== nonce ) {
      return ERR_NONCE;
    }

    const authConfig = await dispatch('getAuthProvider');

    try {
      const res = await authConfig.doAction('login', {
        code,
        description:  'Dashboard UI session',
        responseType: 'cookie',
        ttl:          16 * 60 * 60 * 1000,
      });

      if ( process.server ) {
        const parsed = setCookieParser(res._headers['set-cookie'] || []);

        for ( const opt of parsed ) {
          const key = opt.name;
          const value = opt.value;

          delete opt.name;
          delete opt.value;

          opt.encode = x => x;

          this.$cookies.set(key, value, opt);
        }
      }

      return true;
    } catch (err) {
      console.error(err.response.config.headers, err.response.data);
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
