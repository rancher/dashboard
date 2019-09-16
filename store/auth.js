import { randomStr } from '@/utils/string';
import { addParams } from '@/utils/query-params';

const KEY = 'rc_nonce';
const BASE_SCOPES = ['read:user', 'user:email'];

export const state = function() {
  let nonce = null;

  if ( typeof window !== 'undefined' && window.sessionStorage ) {
    nonce = window.sessionStorage.getItem(KEY);
  }

  return {
    nonce,
    loggedIn:  true, // false,
    principal: null,
  };
};

export const getters = {
  loggedIn() {
    return state.loggedIn;
  },

  prinicpal() {
    return state.principal;
  }
};

export const mutations = {
  loggedInAs(state, principal) {
    state.loggedIn = true;
    state.principal = principal;

    if ( typeof window !== 'undefined' && window.sessionStorage ) {
      window.sessionStorage.removeItem(KEY);
    }
  },

  loggedOut() {
    window.$nuxt.$disconnect();
    state.loggedIn = false;
    state.principal = null;
  },

  setNonce() {
    state.nonce = randomStr(16);
    window.sessionStorage.setItem(KEY, state.nonce);
  }
};

export const actions = {
  async redirectToGithub({ state, commit, dispatch }, opt) {
    const authConfig = await dispatch('rancher/find', {
      type: 'githubProvider',
      id:   'github',
      opt:  { url: '/v3-public/authProviders/github' }
    }, { root: true });

    commit('setNonce');

    const scopes = BASE_SCOPES.slice();

    if ( opt && opt.scopes ) {
      scopes.push(...opt.scopes);
    }

    debugger;

    const url = addParams(authConfig.redirectUrl, {
      scope:        [...BASE_SCOPES, ...scopes].join(','),
      redirect_uri: `${ window.location.origin }/verify`,
      state:        state.nonce
    });

    window.location.href = url;
  },

  logout({ commit }) {
    // @TODO send an API call
    commit('loggedOut');
  }
};
