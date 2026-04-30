import { sortBy } from '@shell/utils/sort';
import { addParam, addParams } from '@shell/utils/url';
import { createDepaginator } from '@shell/apis/shell/proxy';

const ENDPOINT = 'api.linode.com/v4';

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
  async regionOptions({ state, commit, dispatch }, { credentialId }) {
    const regions = await dispatch('cachedCommand', { credentialId, command: 'regions' });

    const out = regions.data.filter((region) => {
      return region.status === 'ok';
    }).map((region) => {
      return {
        label: region.id,
        value: region.id,
      };
    });

    return sortBy(out, 'label');
  },

  async instanceOptions({ dispatch, rootGetters }, { credentialId }) {
    const types = await dispatch('cachedCommand', { credentialId, command: 'linode/types' });

    const available = types.data.map((type) => {
      const out = {
        class:    type.class,
        label:    type.label,
        memoryGb: type.memory,
        disk:     type.disk / 1024,
        vcpus:    type.vcpus,
        value:    type.id
      };

      out.label = rootGetters['i18n/t']('cluster.machineConfig.linode.typeLabel', out);

      return out;
    });

    return sortBy(available, ['class', 'memoryGb', 'vcpus', 'disk']);
  },

  async imageOptions({ dispatch }, { credentialId }) {
    const images = await dispatch('cachedCommand', { credentialId, command: 'images' });

    const out = images.data.filter((image) => {
      return image.status === 'available';
    }).map((image) => {
      return {
        label: image.label,
        value: image.id
      };
    });

    return sortBy(out, 'label');
  },

  async cachedCommand({
    state, getters, commit, dispatch
  }, { credentialId, command }) {
    let out = getters['fromCache']({ credentialId, key: command });

    if ( !out ) {
      out = await dispatch('request', { credentialId, command });
      commit('setCache', {
        credentialId, key: command, value: out
      });
    }

    return out;
  },

  async request(_, {
    token, credentialId, command, opt
  }) {
    opt = opt || {};

    let urlStr = opt.url || `https://${ ENDPOINT }/${ command }`;

    urlStr = addParam(urlStr, 'per_page', `${ opt.per_page || 1000 }`);
    if (opt.params) {
      urlStr = addParams(urlStr, opt.params);
    }

    const authentication = credentialId
      ? {
        id:            credentialId,
        authSigner:    'bearer',
        passwordField: 'token',
      }
      : { token };

    const proxy = this.$shell.proxy;
    const requestOptions = { url: new URL(urlStr), authentication };

    return proxy.request({
      ...requestOptions,
      postProcess: createDepaginator(proxy, requestOptions, {
        nextUrlPath: 'links.pages.next',
        mergeKey:    command,
      }),
    });
  }
};
