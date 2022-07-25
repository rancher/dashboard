export const EXTENDED_SCOPES = ['repo'];
export const GITHUB_BASE_API = 'https://api.github.com';

export const state = function() {
  return {
    repos:  [],
    scopes: []
  };
};

// TODO: Move to Axios or already implemented fetch method (?)
export const FetchGithubAPI = async(endpoint) => {
  try {
    const response = await fetch(`${ GITHUB_BASE_API }/${ endpoint }`);

    if (!response.ok) {
      throw await response.json();
    }

    return response.json();
  } catch (error) {
    if (error.response) {
      return error.response;
    }
  }
};

export const actions = {
  // eslint-disable-next-line no-empty-pattern
  async apiList({}, {
    username, endpoint, repo, branch
  }) {
    switch (endpoint) {
    case 'branches': {
      return await FetchGithubAPI(`repos/${ username }/${ repo }/branches?sort=updated&per_page=100&direction=desc`);
    }
    case 'commits': {
      return await FetchGithubAPI(`repos/${ username }/${ repo }/commits?sha=${ branch }&sort=updated&per_page=100`);
    }
    case 'search': {
      // Fetch for branches
      if (username && repo && branch) {
        const response = await FetchGithubAPI(`repos/${ username }/${ repo }/branches/${ branch }`);

        return [response];
      }

      // Fetch for repos
      const response = await FetchGithubAPI(`search/repositories?q=repo:${ username }/${ repo }`);

      if (response) {
        return response.items;
      }
    }
    }

    return await FetchGithubAPI(`users/${ username }/repos?sort=updated&per_page=100&direction=desc`);
  },

  async fetchRecentRepos({ dispatch }, { username } = {}) {
    const res = await dispatch('apiList', { username });

    return res;
  },

  async fetchBranches({ dispatch }, { repo, username }) {
    const res = await dispatch('apiList', {
      username, endpoint: 'branches', repo
    });

    return res;
  },

  async fetchCommits({ dispatch }, { repo, username, branch }) {
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
