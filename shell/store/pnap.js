import { base64Encode } from '@shell/utils/crypto';

const ENDPOINT = 'api.phoenixnap.com';
const ENDPOINT_CR_NAME = 'rancher-pnap-endpoints';

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

    if ( credentialId ) {
      // Ensure the ProxyEndpoint CR exists so ENDPOINT is on the allow-list.
      const exists = await this.$shell.proxy.hasProxyEndpoint(ENDPOINT_CR_NAME);

      if ( !exists ) {
        await this.$shell.proxy.allowDomains([ENDPOINT], ENDPOINT_CR_NAME);
      }

      return this.$shell.proxy.request({
        url:           opt.url,
        endpoint:      ENDPOINT,
        command,
        perPage:       opt.per_page || 1000,
        params:        opt.params,
        credentialId,
        authSigner:    'bearer',
        passwordField: 'token',
        dePaginate:    true,
        nextUrlPath:   'links.pages.next',
        mergeKey:      command,
        out,
      });
    } else if ( clientId ) {
      // OAuth client-credentials token fetch: POST to the PhoenixNAP auth
      // endpoint with a Basic-encoded client ID/secret.
      const encoded = base64Encode(`${ clientId }:${ clientSecret }`);

      return this.$shell.proxy.request({
        url:        'auth.phoenixnap.com/auth/realms/BMC/protocol/openid-connect/token/',
        method:     'POST',
        token:      encoded,
        authSigner: 'Basic',
      });
    }
  }
};
