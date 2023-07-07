import { isArray } from '@shell/utils/array';

const API_VERSION = 'v4';
const GITLAB_BASE_API = 'https://gitlab.com/api';
const TOKEN = '';
const MAX_RESULTS = 100; // max number of results is 100

const getResponse = (endpoint) => fetch(`${ GITLAB_BASE_API }/${ API_VERSION }/${ endpoint }${ TOKEN }`);

function fetchUserOrOrganization(endpoint) {
  return Promise.all([
    getResponse(`users/${ endpoint }`),
    getResponse(`groups/${ endpoint }`),
  ]).then((responses) => {
    const found = responses.find((r) => r.ok);

    if (!found) {
      throw responses[0];
    }

    return found.json();
  });
}

const fetchGitLabAPI = async(endpoint) => {
  const response = await getResponse(endpoint);

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
    username, email, endpoint, repo, branch
  }) {
    try {
      switch (endpoint) {
      case 'branches': {
        return await fetchGitLabAPI(`projects/${ username }%2F${ repo }/repository/branches?per_page=${ MAX_RESULTS }`);
      }
      case 'repo': {
        return await fetchGitLabAPI(`projects/${ username }%2F${ repo }`);
      }
      case 'commits': {
        return await fetchGitLabAPI(`projects/${ username }%2F${ repo }/repository/commits?ref_name=${ branch }&order_by=updated_at&per_page=${ MAX_RESULTS }`);
      }
      case 'recentRepos': {
        return await fetchUserOrOrganization(`${ username }/projects?order_by=name&sort=asc&per_page=${ MAX_RESULTS }`);
      }
      case 'avatar': {
        return await fetchGitLabAPI(`avatar?email=${ email }`);
      }
      case 'search': {
        // Fetch for a specific branches
        if (username && repo && branch) {
          const response = await fetchGitLabAPI(`projects/${ repo }/repository/branches/${ branch }`);

          return [response];
        }

        // Fetch for repos
        const response = await fetchGitLabAPI(`search/repositories?q=repo:${ username }/${ repo }`);

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

    let commits = [];

    // Get and cache Avatar URLs
    if (res) {
      commits = isArray(res) ? res : [res];

      const avatars = {};

      for (const c of commits) {
        const found = avatars[c.author_email];

        if (found) {
          c.avatar_url = found;
        } else {
          const newAvatar = await dispatch('apiList', {
            username, endpoint: 'avatar', email: c.author_email
          });

          c.avatar_url = newAvatar?.avatar_url;
          avatars[c.author_email] = c.avatar_url;
        }
      }
    }

    return commits;
  },

  async search({ dispatch }, { repo, username, branch }) {
    try {
      const res = await dispatch('apiList', {
        username, endpoint: 'search', repo: repo?.id, branch: branch?.name
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
  }
};
