import { addParam, addParams } from '@/utils/url';

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
