import { sortBy } from '@shell/utils/sort';
import { addParam, addParams } from '@shell/utils/url';

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
  fromCache: state => ({ credentialId, key }) => {
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

  async request({ dispatch }, {
    token, credentialId, command, opt, out
  }) {
    opt = opt || {};

    let url = '/meta/proxy/';

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
    } else if ( token ) {
      headers['X-API-Auth-Header'] = `Bearer ${ token }`;
    }

    const res = await dispatch('management/request', {
      url,
      headers,
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
        token, credentialId, command, opt, out
      });
    }

    return out;
  }
};
