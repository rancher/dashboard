const GITHUB_BASE_API = 'https://api.github.com';

const fetchGithubAPI = async(endpoint) => {
  const response = await fetch(`${ GITHUB_BASE_API }/${ endpoint }`);

  if (!response.ok) {
    throw response;
  }

  return await response.json();
};

export const actions = {
  async apiList(ctx, {
    username, endpoint, repo, branch
  }) {
    try {
      switch (endpoint) {
      case 'branches': {
        return await fetchGithubAPI(`repos/${ username }/${ repo }/branches?sort=updated&per_page=100&direction=desc`);
      }
      case 'commits': {
        return await fetchGithubAPI(`repos/${ username }/${ repo }/commits?sha=${ branch }&sort=updated&per_page=100`);
      }
      case 'search': {
        // Fetch for a specific branches
        if (username && repo && branch) {
          const response = await fetchGithubAPI(`repos/${ username }/${ repo }/branches/${ branch }`);

          return [response];
        }

        // Fetch for repos
        const response = await fetchGithubAPI(`search/repositories?q=repo:${ username }/${ repo }`);

        if (response) {
          return response.items;
        }
      }
      }

      return await fetchGithubAPI(`users/${ username }/repos?sort=updated&per_page=100&direction=desc`);
    } catch (error) {
      throw await error.json() ?? Error(`Error fetching ${ endpoint }`);
    }
  },

  async fetchRecentRepos({ commit, dispatch }, { username } = {}) {
    const res = await dispatch('apiList', { username });

    return res;
  },

  async fetchBranches({ commit, dispatch }, { repo, username }) {
    const res = await dispatch('apiList', {
      username, endpoint: 'branches', repo
    });

    return res;
  },

  async fetchCommits({ commit, dispatch }, { repo, username, branch }) {
    const res = await dispatch('apiList', {
      username, endpoint: 'commits', repo, branch
    });

    return res;
  },
  async search({ dispatch }, { repo, username, branch }) {
    const res = await dispatch('apiList', {
      username, endpoint: 'search', repo, branch
    });

    return res;
  },
};
