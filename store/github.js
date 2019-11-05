export const state = function() {
  return {
    repositories: [],
    branches:     [],
    files:        [],
    scopes:       []
  }
  ;
};

export const actions = {
  // queries on repos for which users have push permissions are paginated and unfilterable
  getRepositories({ commit }) {
    // eslint-disable-next-line prefer-const
    let page = 1;
    const getRepos = (page) => {
      let scopes;

      fetch(`${ window.location.origin }/v1/github/user/repos?per_page=100&affiliation=owner,collaborator&page=${ page }`)
        .then((res) => {
          scopes = res.headers.get('x-oauth-scopes');

          return res.json();
        })
        .then((json) => {
          if (json.length) {
            page++;
            commit('addToRepositories', { repos: json, scopes });

            return getRepos(page);
          }
        });
    };

    getRepos(page);
  },

  getBranches({ commit }, payload) {
    fetch(`${ window.location.origin }/v1/github/repos/${ payload.repo.owner.login }/${ payload.repo.name }/branches`)
      .then(res => res.json())
      .then((json) => {
        commit({ type: 'addBranches', branches: json });
      });
  },

  getContents({ commit }, payload) {
    fetch(`${ window.location.origin }/v1/github/repos/${ payload.repo.owner.login }/${ payload.repo.name }/git/trees/${ payload.branch.commit.sha }?recursive=1`)
      .then(res => res.json())
      .then((json) => {
        const files = json.tree.filter(file => file.type === 'blob' && file.path.match(payload.filePattern));

        commit({ type: 'addFiles', files });
      });
  }
};

export const mutations = {
  addToRepositories(state, payload) {
    state.repositories = [...state.repositories, ...payload.repos];
    state.scopes = payload.scopes;
  },

  addBranches(state, payload) {
    state.branches = payload.branches;
  },

  addFiles(state, payload) {
    state.files = payload.files;
  }
};
