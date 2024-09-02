import { base64Encode } from '@shell/utils/crypto';
import { addParam, addParams } from '@shell/utils/url';

const ENDPOINT = 'api.phoenixnap.com';

export const state = () => {
  return { cache: {} };
};

export const mutations = {
  setCache(state, { credentialId, key, value }) {
    let cache = state.cache[credentialId];

    if ( !cache ) {
      cache = {};
      state.cache[credentialId] = cache;
    }

    cache[key] = value;
  },
};

export const getters = {
  fromCache: (state) => ({ credentialId, key }) => {
    return state.cache[credentialId]?.[key];
  },
};

export const actions = {
  async osChoices({ dispatch }, { credentialId }) {
    const osList = await dispatch('cachedCommand', { credentialId, command: 'rancher-node-driver/options' });

    const oses = osList.operatingSystems;
    const result = [];

    if (Array.isArray(oses)) {
      const map = new Map();

      for (const os of oses) {
        if (!map.has(os)) {
          map.set(os, true);
          result.push({ value: os, label: os });
        }
      }
    } else {
      result.push({ value: osList.message });
    }

    return result;
  },

  async allProducts({ dispatch }, { credentialId }) {
    const out = await dispatch('cachedCommand', { credentialId, command: 'billing/v1/products?productCategory=SERVER' });

    return out;
  },

  async cachedCommand({ getters, commit, dispatch }, { credentialId, command }) {
    let out = getters['fromCache']({ credentialId, key: command });

    if ( !out ) {
      out = await dispatch('request', { credentialId, command });
      commit('setCache', {
        credentialId, key: command, value: out
      });
    }

    return out;
  },

  async request({ dispatch }, {
    clientId, clientSecret, credentialId, command, opt, out
  }) {
    opt = opt || {};

    let url = '/meta/proxy/';
    const body = null;
    let method = 'GET';

    if ( opt.url ) {
      url += opt.url.replace(/^https?:\/\//, '');
    } else {
      url += `${ ENDPOINT }/${ command }`;
      url = addParam(url, 'per_page', opt.per_page || 1000);
      url = addParams(url, opt.params || {});
    }

    const headers = { Accept: 'application/json' };

    if ( credentialId ) {
      headers['X-API-CattleAuth-Header'] = `Bearer credID=${ credentialId } passwordField=token`;
    } else if ( clientId ) {
      const credentials = `${ clientId }:${ clientSecret }`;
      const encoded = base64Encode(credentials);

      headers['Content-Type'] = 'application/json';
      headers['X-API-Auth-Header'] = `Basic ${ encoded }`;
      url = '/meta/proxy/auth.phoenixnap.com/auth/realms/BMC/protocol/openid-connect/token/';
      // body = `grant_type:client_credentials`;
      method = 'POST';
    }

    const res = await dispatch('management/request', {
      url,
      method,
      headers,
      data:                 body,
      redirectUnauthorized: false,
    }, { root: true });

    if ( out ) {
      out[command] = out[command].concat(res[command]);
    } else {
      out = res;
    }

    // De-pagination
    if ( res?.links?.pages?.next ) {
      opt.url = res.links.pages.next;

      return dispatch('request', {
        clientId, clientSecret, credentialId, command, opt, out
      });
    }

    return out;
  }
};
