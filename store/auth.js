import { parse as setCookieParser } from 'set-cookie-parser';
import { randomStr } from '@/utils/string';
import { parse as parseUrl, removeParam, addParam, addParams } from '@/utils/url';
import { findBy, addObjects } from '@/utils/array';
import { open, popupWindowOptions } from '@/utils/window';
import {
  BACK_TO, SPA, AUTH_TEST, _FLAGGED, GITHUB_SCOPE, GITHUB_NONCE, GITHUB_REDIRECT
} from '@/config/query-params';
import { BASE_SCOPES } from '@/store/github';

const KEY = 'rc_nonce';

const ERR_NONCE = 'nonce';
const ERR_CLIENT = 'client';
const ERR_SERVER = 'server';

export const state = function() {
  return {
    hasAuth:     null,
    loggedIn:    false,
    principalId: null,
  };
};

export const getters = {
  enabled(state) {
    return state.hasAuth;
  },

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
  hasAuth(state, hasAuth) {
    state.hasAuth = !!hasAuth;
  },

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

  setNonce() {
    const nonce = randomStr(16);

    this.$cookies.set(KEY, nonce, {
      path:     '/',
      sameSite: false,
      secure:   true,
    });

    return nonce;
  },

  async redirectTo({ state, commit, dispatch }, opt = {}) {
    const provider = opt.provider;
    let redirectUrl = opt.redirectUrl;
    let route = opt.route;

    if ( !redirectUrl ) {
      const driver = await dispatch('getAuthProvider', provider);

      redirectUrl = driver.redirectUrl;
    }

    const nonce = await dispatch('setNonce');

    if (!route) {
      route = '/auth/verify';
    }

    if ( this.$router.options && this.$router.options.base ) {
      const routerBase = this.$router.options.base;

      if ( routerBase !== '/' ) {
        route = `${ routerBase.replace(/\/+$/, '') }/${ route.replace(/^\/+/, '') }`;
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

    const fromQuery = unescape(parseUrl(redirectUrl).query?.[GITHUB_SCOPE] || '');
    const scopes = fromQuery.split(/[, ]+/).filter(x => !!x);

    addObjects(scopes, BASE_SCOPES);

    if ( opt.scopes ) {
      addObjects(scopes, opt.scopes);
    }

    let url = removeParam(redirectUrl, GITHUB_SCOPE);

    url = addParams(url, {
      [GITHUB_SCOPE]:    scopes.join(','),
      [GITHUB_REDIRECT]: returnToUrl,
      [GITHUB_NONCE]:    nonce
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

  async test({ dispatch }, { provider, body }) {
    const driver = await dispatch('getAuthConfig', provider);

    return new Promise((resolve, reject) => {
      window.onAuthTest = (code) => {
        resolve(code);
        delete window.onAuthTest;
      };

      let popup;

      const timer = setInterval(() => {
        if ( popup && popup.closed ) {
          clearInterval(timer);

          return reject(new Error('Access was not authorized'));
        } else if ( popup === null || popup === undefined ) {
          clearInterval(timer);

          return reject(new Error('Please disable your popup blocker for this site'));
        }
      }, 500);

      driver.doAction('configureTest', body).then((res) => {
        dispatch('redirectTo', {
          provider,
          redirectUrl: res.redirectUrl,
          test:        true,
          redirect:    false
        }).then((url) => {
          popup = open(url, 'auth-test', popupWindowOptions());
        }).catch((err) => {
          reject(err);
        });
      });
    });
  },

  async login({ dispatch }, { provider, body }) {
    const driver = await dispatch('getAuthProvider', provider);

    try {
      const res = await driver.doAction('login', {
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
          opt.path = '/';

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

  async logout({ dispatch, commit }) {
    try {
      await dispatch('rancher/request', {
        url:                  '/v3/tokens?action=logout',
        method:               'post',
        data:                 {},
        headers:              { 'Content-Type': 'application/json' },
        redirectUnauthorized: false,
      }, { root: true });
    } catch (e) {
    }

    commit('loggedOut');
    dispatch('onLogout', null, { root: true });
  }
};
