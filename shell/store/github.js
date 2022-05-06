import dayjs from 'dayjs';
import { addParam, parseLinkHeader } from '@shell/utils/url';
import { addObjects, isArray } from '@shell/utils/array';
import { GITHUB_REPOS, GITHUB_SCOPES, _DATE } from '@shell/config/local-storage';

const API_BASE = 'https://api.github.com/';

export const EXTENDED_SCOPES = ['repo'];

export const DOCKERFILE = /^Dockerfile(\..*)?$/i;
export const YAML_FILE = /^.*\.ya?ml$/i;

function getFromStorage(key) {
  if ( process.server ) {
    return null;
  }

  const cached = window.localStorage.getItem(key);

  if ( cached ) {
    try {
      const parsed = JSON.parse(cached);

      return parsed;
    } catch (e) {}
  }
}

function getCachedRepos() {
  const cached = getFromStorage(GITHUB_REPOS);

  return cached || [];
}

function getCachedScopes() {
  const cached = getFromStorage(GITHUB_SCOPES);

  return cached;
}

function hasCached() {
  if ( process.server ) {
    return false;
  }

  const cached = window.localStorage.getItem(GITHUB_REPOS);

  return !!cached;
}

function cacheExpired() {
  if ( process.server ) {
    return false;
  }

  const updated = window.localStorage.getItem(GITHUB_REPOS + _DATE);

  if ( updated && dayjs().diff(updated) <= 60 * 60 * 1000 ) {
    return false;
  }

  return true;
}

function setCache(repos, scopes) {
  if ( repos ) {
    window.localStorage.setItem(GITHUB_REPOS, JSON.stringify(repos));
    window.localStorage.setItem(GITHUB_REPOS + _DATE, (new Date()).toISOString());
  }

  if ( scopes ) {
    window.localStorage.setItem(GITHUB_SCOPES, JSON.stringify(scopes));
  }
}

function forgetCache() {
  window.localStorage.removeItem(GITHUB_REPOS);
  window.localStorage.removeItem(GITHUB_REPOS + _DATE);
  window.localStorage.removeItem(GITHUB_SCOPES);
}

function proxifyUrl(url) {
  // Strip off absolute links to github API
  if ( url.startsWith(API_BASE) ) {
    url = url.substr(API_BASE.length);
  }

  // Add our proxy prefix
  url = `/v1/github/${ url.replace(/^\/+/, '') }`;

  // Less pages please
  addParam(url, 'per_page', 100);

  return url;
}

export const state = function() {
  return {
    repos:  [],
    scopes: []
  };
};

export const actions = {
  async apiList({ commit, dispatch }, {
    url = null,
    single = false,
    depaginate = true,
    onPageFn = null,
    objectKey = 'items',
  } = {}) {
    const out = [];

    url = proxifyUrl(url);

    while ( true ) {
      console.log('Github Request:', url); // eslint-disable-line no-console
      const res = await dispatch('rancher/request', { url }, { root: true });
      const links = parseLinkHeader(res._headers['link']);

      const scopes = res._headers['x-oauth-scopes'];

      if ( scopes ) {
        commit('setScopes', scopes.split(/\s*,\s*/));
      }

      if ( single ) {
        return res;
      }

      addObjects(out, isArray(res) ? res : res[objectKey]);

      if ( onPageFn ) {
        onPageFn(out);
      }

      if ( depaginate && links.next ) {
        url = proxifyUrl(links.next);
      } else {
        break;
      }
    }

    return out;
  },

  forgetCache() {
    forgetCache();
  },

  async fetchRecentRepos({ commit, dispatch }, { allowCache = true } = {}) {
    const cachedScopes = getCachedScopes();

    if ( cachedScopes ) {
      commit('setScopes', cachedScopes);
    }

    if ( allowCache && hasCached() ) {
      const cached = getCachedRepos();

      if ( cacheExpired() ) {
        dispatch('fetchRecentRepos', { allowCache: false });
      }

      return cached;
    }

    const res = await dispatch('apiList', { url: '/user/repos?sort=updated', depaginate: false });
    const more = await dispatch('apiList', { url: '/user/repos?affiliation=owner,collaborator' });
    const out = [...res, ...more];

    commit('setRepos', out);

    return out;
  },

  async searchRepos({ state, dispatch }, { search }) {
    if ( !search ) {
      return state.repos.slice();
    }

    const res = await dispatch('apiList', {
      url:        `/search/repositories?q=${ escape(search) }`,
      depaginate: false
    });

    return res;
  },

  async fetchRepoByUrl({ dispatch }, url) {
    url = url.replace(/.git$/i, '');
    url = url.replace(/https:\/\/github.com\//, '');
    url = `/repos/${ url }`;
    const res = await dispatch('apiList', { url, single: true });

    return res;
  },

  async fetchBranches({ dispatch }, { repo }) {
    const url = repo.branches_url.replace('{/branch}', '');
    const res = await dispatch('apiList', { url });

    return res;
  },

  async fetchBranch({ dispatch }, { repo, name }) {
    name = name || 'master';

    const url = repo.branches_url.replace('{/branch}', `/${ name }`);
    const res = await dispatch('apiList', { url, single: true });

    return res;
  },

  async fetchFiles({ dispatch }, { repo, branch, pattern = null }) {
    let url = repo.trees_url.replace('{/sha}', `/${ branch.commit.sha }`);

    url = addParam(url, 'recursive', 1);

    const res = await dispatch('apiList', { url, objectKey: 'tree' });

    if ( !pattern ) {
      return res;
    }

    const out = res.filter(file => file.type === 'blob' && file.path.match(pattern));

    return out;
  },

  async fetchFile({ dispatch }, { repo, branch, file }) {
    let url = repo.contents_url.replace('{+path}', file);

    url = addParam(url, 'ref', branch.commit.sha);

    const res = await dispatch('apiList', { url, single: true });

    return res;
  },
};

export const mutations = {
  setScopes(state, scopes) {
    state.scopes = scopes;
    setCache(null, scopes);
  },

  setRepos(state, repos) {
    state.repos = repos;
    setCache(repos);
  },
};
