import { sortBy } from '@shell/utils/sort';
import { addParam, addParams } from '@shell/utils/url';

const ENDPOINT = 'api.digitalocean.com/v2';

const PLAN_SORTS = {
  s:        1,
  g:        2,
  gd:       2,
  c:        3,
  m:        4,
  so:       5,
  standard: 98,
  other:    99,
};

const VALID_IMAGES = [
  /^centos-\d+-x64$/,
  /^debian-\d+-x64$/,
  /^fedora-\d+-x64$/,
  /^ubuntu-\d+-\d+-x64$/,
];

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

    const out = regions.regions.filter((region) => {
      return region.available && region.features.includes('metadata');
    }).map((region) => {
      return {
        label: region.name,
        value: region.slug,
      };
    });

    return sortBy(out, 'label');
  },

  async instanceOptions({ dispatch, rootGetters }, { credentialId, region }) {
    const regions = await dispatch('cachedCommand', { credentialId, command: 'regions' });
    const sizes = await dispatch('cachedCommand', { credentialId, command: 'sizes' });

    const regionInfo = regions.regions.find((x) => x.slug === region);
    const available = sizes.sizes.filter((size) => regionInfo.sizes.includes(size.slug)).map((size) => {
      const match = size.slug.match(/^(so|gd|g|c|m|s).*-/);
      const plan = match ? match[1] : (size.slug.includes('-') ? 'standard' : 'other');

      const out = {
        plan,
        planSort: PLAN_SORTS[plan],
        memoryGb: size.memory / 1024,
        disk:     size.disk,
        vcpus:    size.vcpus,
        value:    size.slug
      };

      out.label = rootGetters['i18n/t']('cluster.machineConfig.digitalocean.sizeLabel', out);

      return out;
    }).filter((size) => size.plan !== 'other');

    return sortBy(available, ['planSort', 'memoryGb', 'vcpus', 'disk']);
  },

  async imageOptions({ dispatch }, { credentialId, region }) {
    const images = await dispatch('cachedCommand', { credentialId, command: 'images' });

    const out = images.images.filter((x) => {
      if ( !x.slug || x.slug.match(/x32/) ) {
        return false;
      }

      let valid = false;

      for ( const re of VALID_IMAGES ) {
        if ( x.slug.match(re) ) {
          valid = true;
          break;
        }
      }

      if ( !valid ) {
        return false;
      }

      if ( !x.regions.includes(region) ) {
        return false;
      }

      if ( x.status !== 'available' ) {
        return false;
      }

      return true;
    }).map((x) => {
      let label = `${ x.distribution || '' } ${ x.name || x.description || '' }`;

      label = label.replace(/ image/, '').replace(' x86', '').replace(' x64', '').trim();

      if ( !label ) {
        label = x.slug;
      }

      return {
        label,
        value: x.slug
      };
    });

    return sortBy(out, ['label', 'value']);
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
      headers['x-api-cattleauth-header'] = `Bearer credID=${ credentialId } passwordField=accessToken`;
    } else if ( token ) {
      headers['x-api-auth-header'] = `Bearer ${ token }`;
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
  },
};
