import { actions } from '@shell/store/github';

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

describe('github store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchGithubAPI (via apiList)', () => {
    it('throws an error when response status is 403 (rate-limit exceeded)', async() => {
      const resetTimestamp = 1700000000;

      // For 403, fetchGithubAPI throws an Error object. The apiList catch block
      // then attempts error.json() on an Error — which fails — so the outer
      // promise rejects. We just verify a rejection occurs.
      mockFetch.mockResolvedValue(makeFetchResponse({}, 403, { 'X-RateLimit-Reset': String(resetTimestamp) }));

      const { ctx } = makeCtx();

      await expect(
        actions.apiList(ctx as any, {
          username: 'user',
          endpoint: 'repo',
          repo:     'my-repo',
          branch:   '',
        })
      ).rejects.toBeDefined();
    });

    it('throws the response json when response is not ok (non-403)', async() => {
      const errorBody = { message: 'Not Found' };

      mockFetch.mockResolvedValue(makeFetchResponse(errorBody, 404));

      const { ctx } = makeCtx();

      await expect(
        actions.apiList(ctx as any, {
          username: 'user',
          endpoint: 'repo',
          repo:     'my-repo',
          branch:   '',
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
        username: 'acme',
        endpoint: 'branches',
        repo:     'my-repo',
        branch:   '',
      });

      expect(result).toStrictEqual(branchData);
      expect(mockFetch).toHaveBeenCalledWith('https://api.github.com/repos/acme/my-repo/branches?per_page=100');
    });

    it('fetches repo details for the repo endpoint', async() => {
      const repoData = { id: 1, name: 'my-repo' };

      mockFetch.mockResolvedValue(makeFetchResponse(repoData));

      const { ctx } = makeCtx();
      const result = await actions.apiList(ctx as any, {
        username: 'acme',
        endpoint: 'repo',
        repo:     'my-repo',
        branch:   '',
      });

      expect(result).toStrictEqual(repoData);
      expect(mockFetch).toHaveBeenCalledWith('https://api.github.com/repos/acme/my-repo');
    });

    it('fetches commits for the commits endpoint', async() => {
      const commitData = [{ sha: 'abc' }];

      mockFetch.mockResolvedValue(makeFetchResponse(commitData));

      const { ctx } = makeCtx();
      const result = await actions.apiList(ctx as any, {
        username: 'acme',
        endpoint: 'commits',
        repo:     'my-repo',
        branch:   'main',
      });

      expect(result).toStrictEqual(commitData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/acme/my-repo/commits?sha=main&sort=updated&per_page=100'
      );
    });

    it('fetches recent repos for the recentRepos endpoint', async() => {
      const repoList = [{ id: 1 }, { id: 2 }];

      mockFetch.mockResolvedValue(makeFetchResponse(repoList));

      const { ctx } = makeCtx();
      const result = await actions.apiList(ctx as any, {
        username: 'acme',
        endpoint: 'recentRepos',
        repo:     '',
        branch:   '',
      });

      expect(result).toStrictEqual(repoList);
      expect(mockFetch).toHaveBeenCalledWith('https://api.github.com/users/acme/repos?per_page=100');
    });

    describe('search endpoint', () => {
      it('fetches a specific branch when username, repo, and branch are provided', async() => {
        const branchData = { name: 'feature' };

        mockFetch.mockResolvedValue(makeFetchResponse(branchData));

        const { ctx } = makeCtx();
        const result = await actions.apiList(ctx as any, {
          username: 'acme',
          endpoint: 'search',
          repo:     'my-repo',
          branch:   'feature',
        });

        expect(result).toStrictEqual([branchData]);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.github.com/repos/acme/my-repo/branches/feature'
        );
      });

      it('searches repositories when branch is not provided', async() => {
        const searchResult = { items: [{ id: 1, name: 'my-repo' }] };

        mockFetch.mockResolvedValue(makeFetchResponse(searchResult));

        const { ctx } = makeCtx();
        const result = await actions.apiList(ctx as any, {
          username: 'acme',
          endpoint: 'search',
          repo:     'my-repo',
          branch:   '',
        });

        expect(result).toStrictEqual(searchResult.items);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.github.com/search/repositories?q=repo:acme/my-repo'
        );
      });

      it('returns undefined when search response returns no items and no branch', async() => {
        mockFetch.mockResolvedValue(makeFetchResponse(null));

        const { ctx } = makeCtx();
        const result = await actions.apiList(ctx as any, {
          username: 'acme',
          endpoint: 'search',
          repo:     'my-repo',
          branch:   '',
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
          username: 'acme',
          endpoint: 'repo',
          repo:     'my-repo',
          branch:   '',
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

      const result = await actions.fetchRepoDetails(ctx as any, {
        username: 'acme',
        repo:     { name: 'my-repo' },
      });

      expect(dispatch).toHaveBeenCalledWith('apiList', {
        username: 'acme',
        endpoint: 'repo',
        repo:     'my-repo',
      });
      expect(result).toStrictEqual(repoDetails);
    });
  });

  describe('fetchBranches', () => {
    it('dispatches apiList with branches endpoint and returns result', async() => {
      const branches = [{ name: 'main' }];
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(branches);

      const result = await actions.fetchBranches(ctx as any, {
        username: 'acme',
        repo:     { name: 'my-repo' },
      });

      expect(dispatch).toHaveBeenCalledWith('apiList', {
        username: 'acme',
        endpoint: 'branches',
        repo:     'my-repo',
      });
      expect(result).toStrictEqual(branches);
    });
  });

  describe('fetchCommits', () => {
    it('dispatches apiList with commits endpoint and returns result', async() => {
      const commits = [{ sha: 'abc123' }];
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(commits);

      const result = await actions.fetchCommits(ctx as any, {
        username: 'acme',
        repo:     { name: 'my-repo' },
        branch:   { name: 'main' },
      });

      expect(dispatch).toHaveBeenCalledWith('apiList', {
        username: 'acme',
        endpoint: 'commits',
        repo:     'my-repo',
        branch:   'main',
      });
      expect(result).toStrictEqual(commits);
    });
  });

  describe('search', () => {
    it('returns result with hasError false on success', async() => {
      const searchData = [{ id: 1 }];
      const { ctx, dispatch } = makeCtx();

      dispatch.mockResolvedValue(searchData);

      const result = await actions.search(ctx as any, {
        repo:     { name: 'my-repo' },
        username: 'acme',
        branch:   { name: 'main' },
      });

      expect(result).toStrictEqual({ ...searchData, hasError: false });
    });

    it('returns error message with hasError true on failure', async() => {
      const { ctx, dispatch } = makeCtx();

      dispatch.mockRejectedValue(new Error('network failure'));

      const result = await actions.search(ctx as any, {
        repo:     { name: 'my-repo' },
        username: 'acme',
        branch:   { name: 'main' },
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
        repo:     undefined,
        username: 'acme',
        branch:   undefined,
      });

      expect(dispatch).toHaveBeenCalledWith('apiList', {
        username: 'acme',
        endpoint: 'search',
        repo:     undefined,
        branch:   undefined,
      });
      expect(result).toStrictEqual({ ...searchData, hasError: false });
    });
  });
});
