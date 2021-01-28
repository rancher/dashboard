import { randomStr } from '@/utils/string';
import { parse as parseUrl, removeParam, addParam, addParams } from '@/utils/url';
import { findBy, addObjects } from '@/utils/array';
import { open, popupWindowOptions } from '@/utils/window';
import {
  BACK_TO, SPA, AUTH_TEST, _FLAGGED, GITHUB_SCOPE, GITHUB_NONCE, GITHUB_REDIRECT,
} from '@/config/query-params';

export const BASE_SCOPES = { github: ['read:org'], googleoauth: ['email'] };

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

    if ( !redirectUrl ) {
      const driver = await dispatch('getAuthProvider', provider);

      redirectUrl = driver.redirectUrl;
    }

    const nonce = await dispatch('setNonce');

    let returnToUrl = returnTo(opt, this);

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

    if (BASE_SCOPES[provider]) {
      addObjects(scopes, BASE_SCOPES[provider]);
    }

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

      if (!!driver?.actions?.testAndEnable) {
        const finalRedirectUrl = returnTo({ provider }, this);

        driver.doAction('testAndEnable', { finalRedirectUrl }).then((res) => {
          popup = open(res.idpRedirectUrl, 'auth-test', popupWindowOptions());
        })
          .catch((err) => {
            reject(err);
          });
      } else {
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
      }
    });
  },

  async login({ dispatch }, { provider, body }) {
    const driver = await dispatch('getAuthProvider', provider);

    try {
      await driver.doAction('login', {
        description:  'UI session',
        responseType: 'cookie',
        ...body
      }, { redirectUnauthorized: false });

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

function returnTo(opt, vm) {
  let { route = `/auth/verify` } = opt;

  if ( vm.$router.options && vm.$router.options.base ) {
    const routerBase = vm.$router.options.base;

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

  if (opt.provider) {
    returnToUrl = addParam(returnToUrl, 'config', opt.provider);
  }

  return returnToUrl;
}
