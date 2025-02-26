import { GITHUB_NONCE, GITHUB_REDIRECT, GITHUB_SCOPE } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { _MULTI } from '@shell/plugins/dashboard-store/actions';
import { addObjects, findBy, joinStringList } from '@shell/utils/array';
import { openAuthPopup, returnTo } from '@shell/utils/auth';
import { base64Encode } from '@shell/utils/crypto';
import { removeEmberPage } from '@shell/utils/ember-page';
import { randomStr } from '@shell/utils/string';
import { addParams, parse as parseUrl, removeParam } from '@shell/utils/url';

export const BASE_SCOPES = {
  github:       ['read:org'],
  googleoauth:  ['openid profile email'],
  azuread:      [],
  keycloakoidc: ['openid profile email'],
  genericoidc:  ['openid profile email'],
};

const KEY = 'rc_nonce';

export const LOGIN_ERRORS = {
  CLIENT:              'client',
  CLIENT_UNAUTHORIZED: 'client_unauthorized',
  SERVER:              'server',
  NONCE:               'nonce',
  USER_UNAUTHORIZED:   'user_unauthorized',
};

export const state = function() {
  return {
    fromHeader:  null,
    hasAuth:     null,
    loggedIn:    false,
    principalId: null,
    v3User:      null,
    initialPass: null,
  };
};

export const getters = {
  fromHeader(state) {
    return state.fromHeader;
  },

  enabled(state) {
    return state.hasAuth;
  },

  loggedIn(state) {
    return state.loggedIn;
  },

  principalId(state) {
    return state.principalId;
  },

  v3User(state) {
    return state.v3User;
  },

  initialPass(state) {
    return state.initialPass;
  },

  isGithub(state) {
    return state.principalId && state.principalId.startsWith('github_user://');
  }
};

export const mutations = {
  gotHeader(state, fromHeader) {
    state.fromHeader = fromHeader;
  },

  gotUser(state, v3User) {
    // Always deference to avoid race condition when setting `mustChangePassword`
    state.v3User = { ...v3User };
  },

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
    state.v3User = null;
    state.initialPass = null;
  },

  initialPass(state, pass) {
    state.initialPass = pass;
  }
};

export const actions = {
  gotHeader({ commit }, fromHeader) {
    commit('gotHeader', fromHeader);
  },

  async getUser({ dispatch, commit, getters }) {
    if (getters.v3User) {
      return;
    }

    try {
      const user = await dispatch('rancher/findAll', {
        type: NORMAN.USER,
        opt:  {
          url:    '/v3/users',
          filter: { me: true },
          load:   _MULTI
        }
      }, { root: true });

      commit('gotUser', user?.[0]);
    } catch { }
  },

  gotUser({ commit }, user) {
    commit('gotUser', user);
  },

  setInitialPass({ commit }, pass) {
    commit('initialPass', pass);
  },

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

  /**
   * Create the basic json object used for the nonce (this includes the random nonce/state)
   */
  createNonce(ctx, opt) {
    const out = { nonce: randomStr(16), to: 'vue' };

    if ( opt.test ) {
      out.test = true;
    }

    if (opt.provider) {
      out.provider = opt.provider;
    }

    return out;
  },

  /**
   * Save nonce details. Information it contains will be used to validate auth requests/responses
   * Note - this may be structurally different than the nonce we encode and send
   */
  saveNonce(ctx, opt) {
    const strung = JSON.stringify(opt);

    this.$cookies.set(KEY, strung, {
      path:     '/',
      sameSite: true,
      secure:   true,
    });

    return strung;
  },

  /**
   * Convert the nonce into something we can send
   */
  encodeNonce(ctx, nonce) {
    const stringify = JSON.stringify(nonce);

    return base64Encode(stringify, 'url');
  },

  async redirectTo({ state, commit, dispatch }, opt = {}) {
    const provider = opt.provider;
    let redirectUrl = opt.redirectUrl;

    if ( !redirectUrl ) {
      const driver = await dispatch('getAuthProvider', provider);

      redirectUrl = driver.redirectUrl;
    }
    let returnToUrl = `${ window.location.origin }/verify-auth`;

    if (provider === 'azuread') {
      const params = { response_type: 'code', response_mode: 'query' };

      redirectUrl = addParams(redirectUrl, params );
      returnToUrl = `${ window.location.origin }/verify-auth-azure`;
    }

    // The base nonce that will be sent server way
    const baseNonce = opt.nonce || await dispatch('createNonce', opt);

    // Save a possibly expanded nonce
    await dispatch('saveNonce', opt.persistNonce || baseNonce);
    // Convert the base nonce in to something we can transmit
    const encodedNonce = await dispatch('encodeNonce', baseNonce);

    const fromQuery = unescape(parseUrl(redirectUrl).query?.[GITHUB_SCOPE] || '');
    let scopes = fromQuery.split(/[, ]+/).filter((x) => !!x);

    if (BASE_SCOPES[provider]) {
      addObjects(scopes, BASE_SCOPES[provider]);
    }

    // Need to merge these 2 formats preventing duplicates between code and UI, e.g.
    // [ 'openid profile email' ] from BASE_SCOPES
    // 'openid profile email customScope' from the UI
    if (opt.scopes) {
      scopes = [joinStringList(scopes[0], opt.scopes)];
    }

    let url = removeParam(redirectUrl, GITHUB_SCOPE);

    // TODO: #13457 - Verify use case of scopesJoinChar anywhere outside this repository
    const params = {
      [GITHUB_SCOPE]: scopes.join(opt.scopesJoinChar || ','), // Some providers won't accept comma separated scopes
      [GITHUB_NONCE]: encodedNonce
    };

    if (!url.includes(GITHUB_REDIRECT)) {
      params[GITHUB_REDIRECT] = returnToUrl;
    }

    url = addParams(url, params);

    if ( opt.redirect === false ) {
      return url;
    } else {
      window.location.href = url;
    }
  },

  verifyOAuth({ dispatch }, { nonce, code, provider }) {
    const expectJSON = this.$cookies.get(KEY, { parseJSON: false });
    let parsed;

    try {
      parsed = JSON.parse(expectJSON);
    } catch {
      return LOGIN_ERRORS.NONCE;
    }

    const expect = parsed.nonce;

    if ( !expect || expect !== nonce ) {
      return LOGIN_ERRORS.NONCE;
    }

    const body = { code };

    // If the request came with a pkce code ensure we also sent that in the verify
    if (parsed.pkceCodeVerifier) {
      body.code_verifier = parsed.pkceCodeVerifier;
    }

    return dispatch('login', {
      provider,
      body
    });
  },

  async test({ dispatch }, { provider, body }) {
    const driver = await dispatch('getAuthConfig', provider);

    try {
      // saml providers
      if (!!driver?.actions?.testAndEnable) {
        const finalRedirectUrl = returnTo({ config: provider }, this);

        const res = await driver.doAction('testAndEnable', { finalRedirectUrl });

        const { idpRedirectUrl } = res;

        return openAuthPopup(idpRedirectUrl, provider);
      } else {
      // github, google, azuread, oidc
        const res = await driver.doAction('configureTest', body);
        const { redirectUrl } = res;

        const url = await dispatch('redirectTo', {
          provider,
          redirectUrl,
          scopes:   body.scope,
          test:     true,
          redirect: false
        });

        return openAuthPopup(url, provider);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async login({ dispatch }, { provider, body }) {
    const driver = await dispatch('getAuthProvider', provider);

    try {
      const res = await driver.doAction('login', {
        description:  'UI session',
        responseType: 'cookie',
        ...body
      }, { redirectUnauthorized: false });

      return res;
    } catch (err) {
      if (err._status === 401) {
        return Promise.reject(LOGIN_ERRORS.CLIENT_UNAUTHORIZED);
      } else if (err.message) {
        return Promise.reject(err.message);
      } else if ( err._status >= 400 && err._status <= 499 ) {
        return Promise.reject(LOGIN_ERRORS.CLIENT);
      }

      return Promise.reject(LOGIN_ERRORS.SERVER);
    }
  },

  uiLogout({ commit, dispatch }) {
    removeEmberPage();

    commit('loggedOut');
    dispatch('onLogout', null, { root: true });
  },

  async logout({ dispatch, getters, rootState }, options = {}) {
    // So, we only do this check if auth has been initialized.
    //
    // It's possible to be logged in and visit auth/logout directly instead
    // of navigating from the app while being logged in. Unfortunately auth/logout
    // doesn't use the authenticated middleware which means auth will never be
    // initialized and this check will be invalid. This interferes with how we sometimes
    // logout in our e2e tests.
    //
    // I'm going to leave this as is because we will be modifying and removing authenticated
    // middleware soon and we should remove `force` at that time.
    //
    // TODO: remove `force` once authenticated middleware is removed/made sane.
    if (!options?.force && !getters['loggedIn']) {
      return;
    }

    // Unload plugins - we will load again on login
    await rootState.$plugin.logout();

    let logoutAction = 'logout';
    const data = {};

    // SLO - Single-sign logout - will logout auth provider from all places where it's logged in
    if (options.slo) {
      logoutAction = 'logoutAll';
      data.finalRedirectUrl = returnTo({ isSlo: true }, this);
    }

    try {
      const res = await dispatch('rancher/request', {
        url:                  `/v3/tokens?action=${ logoutAction }`,
        method:               'post',
        data,
        headers:              { 'Content-Type': 'application/json' },
        redirectUnauthorized: false,
      }, { root: true });

      // Single-sign logout for SAML providers that allow for it
      if (res.baseType === 'samlConfigLogoutOutput' && res.idpRedirectUrl) {
        window.location.href = res.idpRedirectUrl;

        return;
      }
    } catch (e) {
    }

    dispatch('uiLogout');
  }
};
