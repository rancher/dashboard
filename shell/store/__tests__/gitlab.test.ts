import { actions } from '@shell/store/gitlab';

const mockFetch = jest.fn();

global.fetch = mockFetch;

function makeFetchResponse(body: any, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok:      status >= 200 && status < 300,
    status,
    headers: { get: (key: string) => headers[key] ?? null },
    json:    () => Promise.resolve(body),
  } as unknown as Response;
}

function makeCtx() {
  const dispatchFn = jest.fn();

  return {
    ctx:      { commit: jest.fn(), dispatch: dispatchFn },
    dispatch: dispatchFn,
  };
}

describe('gitlab store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchGitLabAPI (via apiList)', () => {
    it('throws a rate-limit error when response status is 403', async() => {
      const resetTimestamp = 1700000000;

      mockFetch.mockResolvedValue(makeFetchResponse({}, 403, { 'X-RateLimit-Reset': String(resetTimestamp) }));

      const { ctx } = makeCtx();

      await expect(
        actions.apiList(ctx as any, {
          email: '', username: 'user', endpoint: 'repo', repo: 'my-repo', branch: '',
        })
      ).rejects.toBeDefined();
    });

    it('throws the response json when response is not ok (non-403)', async() => {
      const errorBody = { message: 'Not Found' };

      mockFetch.mockResolvedValue(makeFetchResponse(errorBody, 404));

      const { ctx } = makeCtx();

      await expect(
        actions.apiList(ctx as any, {
          email: '', username: 'user', endpoint: 'repo', repo: 'my-repo', branch: '',
        })
      ).rejects.toStrictEqual(errorBody);
    });
  });

  describe('apiList', () => {
    it('fetches branches for the branches endpoint', async() => {
      const branchData = [{ name: 'main' }, { name: 'dev' }];

      mockFetch.mockResolvedValue(makeFetchResponse(branchData));

      const { ctx } = makeCtx();
      const result = await actions.apiList(ctx as any, {
        email: '', username: 'acme', endpoint: 'branches', repo: 'my-repo', branch: '',
      });

      expect(result).toStrictEqual(branchData);
      expect(mockFetch).toHaveBeenCalledWith('https://gitlab.com/api/v4/projects/acme%2Fmy-repo/repository/branches?per_page=100');
    });

    it('fetches repo details for the repo endpoint', async() => {
      const repoData = { id: 1, name: 'my-repo' };

      mockFetch.mockResolvedValue(makeFetchResponse(repoData));

      const { ctx } = makeCtx();
      const result = await actions.apiList(ctx as any, {
        email: '', username: 'acme', endpoint: 'repo', repo: 'my-repo', branch: '',
      });

      expect(result).toStrictEqual(repoData);
      expect(mockFetch).toHaveBeenCalledWith('https://gitlab.com/api/v4/projects/acme%2Fmy-repo');
    });

    it('fetches commits for the commits endpoint', async() => {
      const commitData = [{ sha: 'abc' }];

      mockFetch.mockResolvedValue(makeFetchResponse(commitData));

      const { ctx } = makeCtx();
      const result = await actions.apiList(ctx as any, {
        email: '', username: 'acme', endpoint: 'commits', repo: 'my-repo', branch: 'main',
      });

      expect(result).toStrictEqual(commitData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/v4/projects/acme%2Fmy-repo/repository/commits?ref_name=main&order_by=updated_at&per_page=100'
      );
    });

    it('fetches avatar for the avatar endpoint', async() => {
      const avatarData = { avatar_url: 'https://example.com/avatar.png' };

      mockFetch.mockResolvedValue(makeFetchResponse(avatarData));

      const { ctx } = makeCtx();
      const result = await actions.apiList(ctx as any, {
        username: 'acme', endpoint: 'avatar', email: 'acme@example.com', repo: '', branch: '',
      });

      expect(result).toStrictEqual(avatarData);
      expect(mockFetch).toHaveBeenCalledWith('https://gitlab.com/api/v4/avatar?email=acme@example.com');
    });

    describe('recentRepos endpoint (fetchUserOrOrganization)', () => {
      it('returns the user response when the user lookup succeeds', async() => {
        const repoList = [{ id: 1 }, { id: 2 }];

        mockFetch
          .mockResolvedValueOnce(makeFetchResponse(repoList, 200))
          .mockResolvedValueOnce(makeFetchResponse({}, 404));

        const { ctx } = makeCtx();
        const result = await actions.apiList(ctx as any, {
          email: '', username: 'acme', endpoint: 'recentRepos', repo: '', branch: '',
        });

        expect(result).toStrictEqual(repoList);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://gitlab.com/api/v4/users/acme/projects?order_by=name&sort=asc&per_page=100'
        );
        expect(mockFetch).toHaveBeenCalledWith(
          'https://gitlab.com/api/v4/groups/acme/projects?order_by=name&sort=asc&per_page=100'
        );
      });

      it('returns the group response when only the group lookup succeeds', async() => {
        const repoList = [{ id: 3 }];

        mockFetch
          .mockResolvedValueOnce(makeFetchResponse({}, 404))
          .mockResolvedValueOnce(makeFetchResponse(repoList, 200));

        const { ctx } = makeCtx();
        const result = await actions.apiList(ctx as any, {
          email: '', username: 'acme-org', endpoint: 'recentRepos', repo: '', branch: '',
        });

        expect(result).toStrictEqual(repoList);
      });

      it('throws the first response when both user and group lookups fail', async() => {
        mockFetch
          .mockResolvedValueOnce(makeFetchResponse({ message: 'user not found' }, 404))
          .mockResolvedValueOnce(makeFetchResponse({ message: 'group not found' }, 404));

        const { ctx } = makeCtx();

        await expect(
          actions.apiList(ctx as any, {
            email: '', username: 'unknown', endpoint: 'recentRepos', repo: '', branch: '',
          })
        ).rejects.toStrictEqual({ message: 'user not found' });
      });
    });

    describe('search endpoint', () => {
      it('fetches a specific branch when username, repo, and branch are provided', async() => {
        const branchData = { name: 'feature' };

        mockFetch.mockResolvedValue(makeFetchResponse(branchData));

        const { ctx } = makeCtx();
        const result = await actions.apiList(ctx as any, {
          email: '', username: 'acme', endpoint: 'search', repo: 'my-repo', branch: 'feature',
        });

        expect(result).toStrictEqual([branchData]);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://gitlab.com/api/v4/projects/my-repo/repository/branches/feature'
        );
      });

      it('searches repositories when branch is not provided', async() => {
        const searchResult = { items: [{ id: 1, name: 'my-repo' }] };

        mockFetch.mockResolvedValue(makeFetchResponse(searchResult));

        const { ctx } = makeCtx();
        const result = await actions.apiList(ctx as any, {
          email: '', username: 'acme', endpoint: 'search', repo: 'my-repo', branch: '',
        });

        expect(result).toStrictEqual(searchResult.items);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://gitlab.com/api/v4/search/repositories?q=repo:acme/my-repo'
        );
      });

      it('returns undefined when search response returns no items and no branch', async() => {
        mockFetch.mockResolvedValue(makeFetchResponse(null));

        const { ctx } = makeCtx();
        const result = await actions.apiList(ctx as any, {
          email: '', username: 'acme', endpoint: 'search', repo: 'my-repo', branch: '',
        });

        expect(result).toBeUndefined();
      });
    });

    it('propagates error from failed fetch as json error', async() => {
      const errorResponse = {
        ok:      false,
        status:  500,
        headers: { get: () => null },
        json:    () => Promise.resolve({ message: 'server error' }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(errorResponse);

      const { ctx } = makeCtx();

      await expect(
        actions.apiList(ctx as any, {
          email: '', username: 'acme', endpoint: 'repo', repo: 'my-repo', branch: '',
        })
      ).rejects.toStrictEqual({ message: 'server error' });
    });
  });

  describe('fetchRecentRepos', () => {
    it('dispatches apiList with recentRepos endpoint and returns result', async() => {
      const repos = [{ id: 1 }];
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(repos);

      const result = await actions.fetchRecentRepos(ctx as any, { username: 'acme' });

      expect(dispatch).toHaveBeenCalledWith('apiList', { username: 'acme', endpoint: 'recentRepos' });
      expect(result).toStrictEqual(repos);
    });
  });

  describe('fetchRepoDetails', () => {
    it('dispatches apiList with repo endpoint and returns result', async() => {
      const repoDetails = { id: 42, name: 'my-repo' };
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(repoDetails);

      const result = await actions.fetchRepoDetails(ctx as any, { username: 'acme', repo: { name: 'my-repo' } });

      expect(dispatch).toHaveBeenCalledWith('apiList', {
        username: 'acme', endpoint: 'repo', repo: 'my-repo',
      });
      expect(result).toStrictEqual(repoDetails);
    });
  });

  describe('fetchBranches', () => {
    it('dispatches apiList with branches endpoint and returns result', async() => {
      const branches = [{ name: 'main' }];
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(branches);

      const result = await actions.fetchBranches(ctx as any, { username: 'acme', repo: { name: 'my-repo' } });

      expect(dispatch).toHaveBeenCalledWith('apiList', {
        username: 'acme', endpoint: 'branches', repo: 'my-repo',
      });
      expect(result).toStrictEqual(branches);
    });
  });

  describe('fetchCommits', () => {
    it('returns an empty array when apiList resolves falsy', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValueOnce(undefined);

      const result = await actions.fetchCommits(ctx as any, {
        username: 'acme', repo: { name: 'my-repo' }, branch: { name: 'main' },
      });

      expect(dispatch).toHaveBeenCalledWith('apiList', {
        username: 'acme', endpoint: 'commits', repo: 'my-repo', branch: 'main',
      });
      expect(result).toStrictEqual([]);
    });

    it('wraps a single commit object result into an array', async() => {
      const { ctx, dispatch } = makeCtx();
      const singleCommit = { author_email: 'a@example.com' };

      dispatch
        .mockResolvedValueOnce(singleCommit)
        .mockResolvedValueOnce({ avatar_url: 'https://example.com/a.png' });

      const result = await actions.fetchCommits(ctx as any, {
        username: 'acme', repo: { name: 'my-repo' }, branch: { name: 'main' },
      });

      expect(result).toStrictEqual([{ author_email: 'a@example.com', avatar_url: 'https://example.com/a.png' }]);
    });

    it('fetches and caches avatar urls per unique author email', async() => {
      const { ctx, dispatch } = makeCtx();
      const commits = [
        { sha: '1', author_email: 'a@example.com' },
        { sha: '2', author_email: 'a@example.com' },
        { sha: '3', author_email: 'b@example.com' },
      ];

      dispatch
        .mockResolvedValueOnce(commits)
        .mockResolvedValueOnce({ avatar_url: 'https://example.com/a.png' })
        .mockResolvedValueOnce({ avatar_url: 'https://example.com/b.png' });

      const result = await actions.fetchCommits(ctx as any, {
        username: 'acme', repo: { name: 'my-repo' }, branch: { name: 'main' },
      });

      expect(result).toStrictEqual([
        {
          sha: '1', author_email: 'a@example.com', avatar_url: 'https://example.com/a.png'
        },
        {
          sha: '2', author_email: 'a@example.com', avatar_url: 'https://example.com/a.png'
        },
        {
          sha: '3', author_email: 'b@example.com', avatar_url: 'https://example.com/b.png'
        },
      ]);
      // apiList called once for commits + once per unique email (2) = 3 total
      expect(dispatch).toHaveBeenCalledTimes(3);
    });
  });

  describe('search', () => {
    it('returns result with hasError false on success', async() => {
      const searchData = [{ id: 1 }];
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(searchData);

      const result = await actions.search(ctx as any, {
        repo: { id: 1 }, username: 'acme', branch: { name: 'main' },
      });

      expect(result).toStrictEqual({ ...searchData, hasError: false });
    });

    it('returns error message with hasError true on failure', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockRejectedValue(new Error('network failure'));

      const result = await actions.search(ctx as any, {
        repo: { id: 1 }, username: 'acme', branch: { name: 'main' },
      });

      expect(result).toStrictEqual({
        message:  'network failure',
        hasError: true,
      });
    });

    it('handles undefined repo and branch gracefully', async() => {
      const searchData = [{ id: 2 }];
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(searchData);

      const result = await actions.search(ctx as any, {
        repo: undefined, username: 'acme', branch: undefined,
      });

      expect(dispatch).toHaveBeenCalledWith('apiList', {
        username: 'acme', endpoint: 'search', repo: undefined, branch: undefined,
      });
      expect(result).toStrictEqual({ ...searchData, hasError: false });
    });
  });
});
