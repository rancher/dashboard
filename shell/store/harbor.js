import { tagsSortingInit, tagsResultFormat } from '@shell/utils/harbor';

export const state = function() {
  return {
    harborServer: null,
    harborImages: {
      raw:  [],
      urls: [],
    },
    harborImageTags: [],
  };
};

export const mutations = {
  setHarborServer(state, harborServer) {
    if (!harborServer) {
      return null;
    }
    const repo = harborServer.includes('://') ? harborServer.substr(harborServer.indexOf('://') + 3) : harborServer;

    state.harborRepo = repo;
    state.harborServer = harborServer;
  },
  setHarborImages(state, harborImages) {
    state.harborImages = harborImages;
  },
  setHarborImageTags(state, harborImageTags) {
    state.harborImageTags = harborImageTags;
  },
  setImageTag(state, imageTag) {
    state.imageTag = imageTag;
  },
  setLatestQuery(state, latestQuery) {
    state.latestQuery = latestQuery;
  },
  setHarborVersion(state, harborVersion) {
    state.harborVersion = harborVersion;
  },
};

export const actions = {
  apiList({ dispatch }, { commitVal, url = null, headers = null } = {}) {
    return dispatch('rancher/request', { url, headers: headers || undefined }, { root: true });
  },

  loadHarborServerUrl({ dispatch, commit }) {
    return dispatch('apiList', { url: '/v3/settings/harbor-server-url' } ).then((res) => {
      commit('setHarborServer', res.value || '');
    });
  },

  loadImagesInHarbor({
    state, dispatch, commit, getters
  }, query, loading, vm) {
    const input = query;

    if (!query) {
      commit('setHarborImages', {
        raw:  [],
        urls: [],
      });

      commit('setHarborImageTags', []);
      commit('setImageTag', null);

      return;
    }
    const harborRepo = state.harborRepo;

    if (query.startsWith(`${ harborRepo }/`)) {
      query = query.replace(`${ harborRepo }/`, '');
    }
    query = query.includes(':') ? query.substr(0, query.indexOf(':')) : query;
    if (state.latestQuery === query) {
      return;
    }

    commit('setLatestQuery', query);

    dispatch('fetchProjectsAndImages', input );
  },

  fetchProjectsAndImages({
    state, dispatch, commit, rootGetters
  }, input) {
    const isAdmin = rootGetters['auth/isAdmin'];

    if (!state.harborServer) {
      return;
    }

    return dispatch('apiList', {
      url:     `/meta/harbor/${ ( state.harborServer ).replace('//', '/').replace(/\/+$/, '') }/api${ state.harborVersion === 'v2.0' ? `/${ state.harborVersion }` : '' }/search?q=${ encodeURIComponent(state.latestQuery) }`,
      headers: { 'X-API-Harbor-Admin-Header': !!isAdmin },
    } ).then((res) => {
      const repos = res.repository;
      const repo = state.harborRepo;
      const urls = repos.map((r) => {
        return `${ repo }/${ r.repository_name }`;
      });

      commit('setHarborImages', {
        raw: repos,
        urls,
      });

      dispatch('loadHarborImageVersions', { searchImage: input, harborRepo: repo } );
    });
  },

  fetchHarborVersion({ dispatch, commit }) {
    return dispatch('apiList', { url: '/v3/settings/harbor-version' } ).then((res) => {
      commit('setHarborVersion', res.value || '');
    });
  },

  fetchTags({ rootGetters, state, dispatch }, { projectId, name }) {
    const isAdmin = rootGetters['auth/isAdmin'];

    return dispatch('apiList', {
      url:     `/meta/harbor/${ state.harborServer.replace('//', '/').replace(/\/+$/, '') }/api/repositories/${ name }/tags?detail=${ projectId }`,
      headers: { 'X-API-Harbor-Admin-Header': !!isAdmin },
    });
  },

  fetchTagsV2({ dispatch, rootGetters, state }, p) {
    // EncodeURIComponent twice for harbor2.0
    const isAdmin = rootGetters['auth/isAdmin'];
    const params = Object.entries(p.q).map((p) => {
      if (p[0] === 'page' || p[0] === 'page_size' ) {
        return `${ p[0] }=${ p[1] }`;
      } else {
        return `q=${ encodeURIComponent(`${ p[0] }%3D~${ p[1] }`) }`;
      }
    }).join('&');
    const repoName = p.repository_name.replace(`${ p.project_name }/`, '').replace('/', '%252F');

    return dispatch('apiList', {
      url:     `/meta/harbor/${ (state?.harborServer || '').replace('//', '/').replace(/\/+$/, '') }/api${ state.harborVersion === 'v2.0' ? `/${ state.harborVersion }` : '' }/projects/${ p.project_name }/repositories/${ repoName }/artifacts?with_tag=true&with_scan_overview=true&with_label=true&${ params }`,
      headers: { 'X-API-Harbor-Admin-Header': !!isAdmin },
    });
  },

  async loadHarborImageVersions({ state, commit, dispatch }, { searchImage, harborRepo }) {
    if (!searchImage.startsWith(harborRepo)) {
      commit('setHarborImageTags', []);

      return;
    }

    const image = searchImage.replace(`${ harborRepo }/`, '').includes(':') ? searchImage.substr(0, searchImage.lastIndexOf(':')) : searchImage;
    const repo = state.harborImages.raw.find((item) => {
      return image === `${ harborRepo }/${ item.repository_name }`;
    });

    if (!repo) {
      commit('setHarborImageTags', []);

      return;
    }

    if (state.harborVersion === 'v2.0') {
      const param = {
        project_id:      repo.project_id,
        project_name:    repo.project_name,
        repository_name: repo.repository_name,
      };

      // We want to load all the artifacts but harbor2.0 returns 10 by default, so pass 10000 to make sure they are all returned.
      param.q = {
        page_size: 100,
        page:      1,
      };

      const tagList = await dispatch('fetchTagsV2', param);
      const names = [];
      let tags = [];

      try {
        tagList.forEach((artifact) => {
          artifact.tags && artifact.tags.forEach(({ name }) => {
            names.push(name);
          });
        });
        tags = tagsResultFormat(tagsSortingInit(names));
      } catch (err) {
        tags = tagList;
      }

      const imageTag = searchImage.includes(':') ? searchImage.substr(searchImage.indexOf(':') + 1) : null;
      const tag = tags.find(t => t.name === imageTag);

      commit('setImageTag', tag && tag.name);
      commit('setHarborImageTags', tags);
    } else {
      const tagList = await dispatch('fetchTags', { projectId: repo.project_id, name: repo.repository_name });
      const names = [];
      let tags = [];

      try {
        Array.from(tagList).forEach(({ name }) => {
          names.push(name);
        });
        tags = tagsResultFormat(tagsSortingInit(tagList.map(t => t.name)));
      } catch (err) {
        tags = tagList;
      }

      commit('setHarborImageTags', tags);

      if (searchImage.includes(':')) {
        const imageTag = searchImage.substr(searchImage.indexOf(':') + 1);
        const tag = tags.find(t => t.name === imageTag);

        if (tag?.name) {
          commit('setImageTag', tag.name);
        }
      }
    }
  },
};

const stateSchema = state();

export const getters = {
  harborServer: (state = stateSchema) => {
    return state.harborServer;
  },
  all: (state = stateSchema) => {
    return state;
  }
};
