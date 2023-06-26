const GITHUB_BASE_API = 'https://api.github.com';
const MAX_RESULTS = 100; // max number of results is 100

const fetchGithubAPI = async(endpoint) => {
  const response = await fetch(`${ GITHUB_BASE_API }/${ endpoint }`);

  // If rate-limit is exceeded, we should wait until the rate limit is reset
  if (response.status === 403) {
    const resetTime = new Date(response.headers.get('X-RateLimit-Reset') * 1000);

    throw new Error(`Rate limit exceeded. Try again at ${ resetTime }`);
  }

  if (!response.ok) {
    throw response;
  }

  return await response.json();
};

export const getters = {};

export const actions = {
  async apiList(ctx, {
    username, endpoint, repo, branch
  }) {
    try {
      switch (endpoint) {
      case 'branches': {
        return await fetchGithubAPI(`repos/${ username }/${ repo }/branches?per_page=${ MAX_RESULTS }`);
      }
      case 'repo': {
        return await fetchGithubAPI(`repos/${ username }/${ repo }`);
      }
      case 'commits': {
        return await fetchGithubAPI(`repos/${ username }/${ repo }/commits?sha=${ branch }&sort=updated&per_page=${ MAX_RESULTS }`);
      }
      case 'recentRepos': {
        return await fetchGithubAPI(`users/${ username }/repos?per_page=${ MAX_RESULTS }`);
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
    } catch (error) {
      throw await error.json() ?? Error(`Error fetching ${ endpoint }`);
    }
  },

  async fetchRecentRepos({ commit, dispatch }, { username } = {}) {
    const res = await dispatch('apiList', { username, endpoint: 'recentRepos' });

    return res;
  },

  async fetchRepoDetails({ commit, dispatch }, { username, repo } = {}) {
    const res = await dispatch('apiList', {
      username, endpoint: 'repo', repo: repo.name
    });

    return res;
  },

  async fetchBranches({ commit, dispatch }, { repo, username }) {
    const res = await dispatch('apiList', {
      username, endpoint: 'branches', repo: repo.name
    });

    return res;
  },

  async fetchCommits(ctx, { repo, username, branch }) {
    const { dispatch } = ctx;
    const res = await dispatch('apiList', {
      username, endpoint: 'commits', repo: repo.name, branch: branch.name
    });

    return res;
  },
  async search({ dispatch }, { repo, username, branch }) {
    try {
      const res = await dispatch('apiList', {
        username, endpoint: 'search', repo: repo?.name, branch: branch?.name
      });

      return {
        ...res,
        hasError: false,
      };
    } catch (error) {
      return {
        message:  error.message,
        hasError: true
      };
    }
  },
};
