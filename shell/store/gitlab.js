import { isArray } from '@shell/utils/array';

const API_VERSION = 'v4';
const GITLAB_BASE_API = 'https://gitlab.com/api';
const TOKEN = '';

const fetchGitLabAPI = async(endpoint) => {
  const response = await fetch(`${ GITLAB_BASE_API }/${ API_VERSION }/${ endpoint }${ TOKEN }`);

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
        return await fetchGitLabAPI(`projects/${ repo }/repository/branches?order_by=updated_at&per_page=100`);
      }
      case 'repo': {
        return await fetchGitLabAPI(`projects/${ repo }?`);
      }
      case 'commits': {
        return await fetchGitLabAPI(`projects/${ repo }/repository/commits/${ branch }?order_by=updated_at&per_page=100`);
      }
      case 'recentRepos': {
        return await fetchGitLabAPI(`users/${ username }/projects?order_by=updated_at&per_page=100`);
      }
      case 'avatar': {
        return await fetchGitLabAPI(`avatar?email=${ email }`);
      }
      case 'search': {
        // Fetch for a specific branches
        if (username && repo && branch) {
          const response = await fetchGitLabAPI(`repos/${ username }/${ repo }/branches/${ branch }?`);

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
      username, endpoint: 'repo', repo: repo.id
    });

    return res;
  },

  async fetchBranches({ commit, dispatch }, { repo, username }) {
    const res = await dispatch('apiList', {
      username, endpoint: 'branches', repo: repo.id
    });

    return res;
  },

  async fetchCommits(ctx, { repo, username, branch }) {
    const { dispatch } = ctx;

    const res = await dispatch('apiList', {
      username, endpoint: 'commits', repo: repo.id, branch: branch.name
    });

    let commits = [];

    if (res) {
      commits = isArray(res) ? res : [res];

      for (const c of commits) {
        const avatar = await dispatch('apiList', {
          username, endpoint: 'avatar', email: c.author_email
        });

        c.avatar_url = avatar?.avatar_url;
      }
    }

    return commits.length === 1 ? commits[0] : commits;
  },

  async search({ dispatch }, { repo, username, branch }) {
    const res = await dispatch('apiList', {
      username, endpoint: 'search', repo, branch
    });

    return res;
  }
};
