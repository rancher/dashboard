import { randomStr } from '@/utils/string';

const KEY = 'rc_nonce';

export const state = function() {
  let nonce = null;

  if ( typeof window !== 'undefined' && window.sessionStorage ) {
    nonce = window.sessionStorage.getItem(KEY);
  }

  return {
    nonce,
    loggedIn:  false,
    principal: null,
  };
};

export const mutations = {
  loggedInAs(state, principal) {
    state.loggedIn = true;
    state.principal = principal;
    window.sessionStorage.removeItem(KEY);
  },

  loggedOut() {
    state.loggedIn = false;
    state.principal = null;
  },

  setNonce() {
    state.nonce = randomStr(16);
    window.sessionStorage.setItem(KEY, state.nonce);
  }
};

export const actions = {
  logout({ commit }) {
    // @TODO send an API call
    commit('loggedOut');
  }
};
