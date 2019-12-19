import { parse as setCookieParser } from 'set-cookie-parser';
import { randomStr } from '@/utils/string';
import { parse as parseUrl, addParam, addParams } from '@/utils/url';
import { findBy, addObjects } from '@/utils/array';
import { BACK_TO, SPA, AUTH_TEST, _FLAGGED } from '@/config/query-params';
import { BASE_SCOPES } from '@/store/github';

const KEY = 'rc_nonce';

const ERR_NONCE = 'nonce';
const ERR_CLIENT = 'client';
const ERR_SERVER = 'server';

export const state = function() {
  return {
    loggedIn:    false,
    principalId: null,
  };
};

export const getters = {
  loggedIn(state) {
    return state.loggedIn;
  },

  principalId(state) {
    return state.principalId;
  },

  isGithub(state) {
    return state.principalId && state.principalId.startsWith('github_user://');
  }
};

export const mutations = {
  loggedInAs(state, principalId) {
    state.loggedIn = true;
    state.principalId = principalId;

    this.$cookies.remove(KEY);
  },

  loggedOut(state) {
    // Note: plugin/norman/index watches for this mutation
    // to automatically disconnect subscribe sockets.

    state.loggedIn = false;
    state.principalId = null;
  },
};

export const actions = {
  getAuthProviders({ dispatch }) {
    return dispatch('rancher/findAll', {
      type: 'authProvider',
      opt:  { url: `/v3-public/authProviders`, watch: false }
    }, { root: true });
  },

  getAuthConfigs({ dispatch }) {
    return dispatch('rancher/findAll', {
      type: 'authConfig',
      opt:  { url: `/v3/authConfigs` }
    }, { root: true });
  },

  async getAuthProvider({ dispatch }, id) {
    const authProviders = await dispatch('getAuthProviders');

    return findBy(authProviders, 'id', id);
  },

  async getAuthConfig({ dispatch }, id) {
    const authConfigs = await dispatch('getAuthConfigs');

    return findBy(authConfigs, 'id', id);
  },

  async redirectToGithub({ state, commit, dispatch }, opt = {}) {
    let redirectUrl = opt.redirectUrl;
    let route = opt.route;

    if ( !redirectUrl ) {
      const authProvider = await dispatch('getAuthProvider', 'github');

      redirectUrl = authProvider.redirectUrl;
    }

    const nonce = randomStr(16);

    this.$cookies.set(KEY, nonce, {
      path:     '/',
      sameSite: false,
      secure:   true,
    });

    const scopes = BASE_SCOPES.slice();

    if ( opt.scopes ) {
      addObjects(scopes, opt.scopes);
    }

    if (!route) {
      route = '/auth/verify';
    }

    if ( this.$router.options && this.$router.options.base ) {
      const routerBase = this.$router.options.base;

      if ( routerBase !== '/' ) {
        route = `${ routerBase.replace(/\/+$/, '') }/${ opt.route.replace(/^\/+/, '') }`;
      }
    }

    let returnToUrl = `${ window.location.origin }${ route }`;

    const parsed = parseUrl(window.location.href);

    if ( parsed.query.spa !== undefined ) {
      returnToUrl = addParam(returnToUrl, SPA, _FLAGGED);
    }

    if ( opt.test ) {
      returnToUrl = addParam(returnToUrl, AUTH_TEST, _FLAGGED);
    }

    if ( opt.backTo ) {
      returnToUrl = addParam(returnToUrl, BACK_TO, opt.backTo);
    }

    const url = addParams(redirectUrl, {
      scope:        scopes.join(','),
      redirect_uri: returnToUrl,
      state:        nonce
    });

    if ( opt.redirect === false ) {
      return url;
    } else {
      window.location.href = url;
    }
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

  async testGithub({ dispatch }, { nonce, code, config }) {
    const expect = this.$cookies.get(KEY, { parseJSON: false });

    if ( !expect || expect !== nonce ) {
      return ERR_NONCE;
    }

    const authConfig = await dispatch('getAuthConfig', 'github');

    await authConfig.doAction('testAndApply', {
      code,
      enabled:      true,
      githubConfig: config
    });
  },

  async login({ dispatch }, { provider, body }) {
    const authProvider = await dispatch('getAuthProvider', provider);

    try {
      const res = await authProvider.doAction('login', {
        description:  'Dashboard UI session',
        responseType: 'cookie',
        ttl:          16 * 60 * 60 * 1000,
        ...body
      }, { redirectUnauthorized: false });

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
      if ( err._status >= 400 && err._status <= 499 ) {
        return Promise.reject(ERR_CLIENT);
      }

      return Promise.reject(ERR_SERVER);
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
    dispatch('clearNorman', null, { root: true });
  }
};
