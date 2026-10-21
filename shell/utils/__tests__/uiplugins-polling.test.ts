import {
  waitForUIExtension,
  waitForUIPackage,
  createHelmRepository,
  getHelmChart,
} from '@shell/utils/uiplugins';

// Mock dependencies with no real disk/network I/O
jest.mock('@shell/config/uiplugins', () => ({
  UI_PLUGIN_BASE_URL:      '/v1/uiplugins',
  isSupportedChartVersion: jest.fn(),
  UI_PLUGIN_LABELS:        { CATALOG_IMAGE: 'catalog.cattle.io/ui-catalog-image' },
}));

jest.mock('@shell/utils/string', () => ({ matchesSomeRegex: jest.fn() }));

jest.mock('@shell/config/labels-annotations', () => ({
  CATALOG: {
    SOURCE_REPO_TYPE: 'catalog.cattle.io/ui-source-repo-type',
    SOURCE_REPO_NAME: 'catalog.cattle.io/ui-source-repo',
  },
}));

jest.mock('@shell/config/types', () => ({ CATALOG: { CLUSTER_REPO: 'catalog.cattle.io.clusterrepo' } }));

describe('shell/utils/uiplugins polling helpers', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('waitForUIExtension', () => {
    it('returns the extension immediately when found on the first try under "entries"', async() => {
      const extension = { name: 'my-ext' };
      const dispatch = jest.fn().mockResolvedValue({ entries: { 'my-ext': extension } });
      const store = { dispatch };

      const result = await waitForUIExtension(store, 'my-ext');

      expect(result).toStrictEqual(extension);
      expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('finds the extension under the capitalized "Entries" key', async() => {
      const extension = { name: 'my-ext' };
      const dispatch = jest.fn().mockResolvedValue({ Entries: { 'my-ext': extension } });
      const store = { dispatch };

      const result = await waitForUIExtension(store, 'my-ext');

      expect(result).toStrictEqual(extension);
    });

    it('retries after a failed request and eventually finds the extension', async() => {
      const extension = { name: 'my-ext' };
      const dispatch = jest.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({ entries: { 'my-ext': extension } });
      const store = { dispatch };

      const promise = waitForUIExtension(store, 'my-ext', 10, 2500);

      await jest.advanceTimersByTimeAsync(2500);

      const result = await promise;

      expect(result).toStrictEqual(extension);
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(errorSpy).toHaveBeenCalledWith('waiting for UI extension to be available: error =', expect.any(Error));
    });

    it('retries while the extension is simply absent from entries, not just on error', async() => {
      const extension = { name: 'my-ext' };
      const dispatch = jest.fn()
        .mockResolvedValueOnce({ entries: {} })
        .mockResolvedValueOnce({ entries: { 'my-ext': extension } });
      const store = { dispatch };

      const promise = waitForUIExtension(store, 'my-ext', 10, 2500);

      await jest.advanceTimersByTimeAsync(2500);

      const result = await promise;

      expect(result).toStrictEqual(extension);
      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('returns null after exceeding maxRetries', async() => {
      const dispatch = jest.fn().mockResolvedValue({ entries: {} });
      const store = { dispatch };

      const promise = waitForUIExtension(store, 'my-ext', 2, 1000);

      await jest.advanceTimersByTimeAsync(10000);

      const result = await promise;

      expect(result).toBeNull();
      // Initial try + 2 retries = 3 calls before giving up
      expect(dispatch).toHaveBeenCalledTimes(3);
    });
  });

  describe('waitForUIPackage', () => {
    it('returns true immediately when the package request succeeds', async() => {
      const dispatch = jest.fn().mockResolvedValue({});
      const store = { dispatch };

      const result = await waitForUIPackage(store, { name: 'my-ext', version: '1.0.0' });

      expect(result).toBe(true);
      expect(dispatch).toHaveBeenCalledWith('management/request', expect.objectContaining({ url: '/v1/uiplugins/my-ext/1.0.0/plugin/my-ext-1.0.0.umd.min.js' }));
    });

    it('retries after a failed request and eventually succeeds', async() => {
      const dispatch = jest.fn()
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce({});
      const store = { dispatch };

      const promise = waitForUIPackage(store, { name: 'my-ext', version: '1.0.0' }, 10, 2500);

      await jest.advanceTimersByTimeAsync(2500);

      const result = await promise;

      expect(result).toBe(true);
      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('returns false after exceeding maxRetries', async() => {
      const dispatch = jest.fn().mockRejectedValue(new Error('not found'));
      const store = { dispatch };

      const promise = waitForUIPackage(store, { name: 'my-ext', version: '1.0.0' }, 2, 1000);

      await jest.advanceTimersByTimeAsync(10000);

      const result = await promise;

      expect(result).toBe(false);
      expect(dispatch).toHaveBeenCalledTimes(3);
    });
  });

  describe('createHelmRepository', () => {
    const makeRepoModel = (id: string) => ({
      id,
      save: jest.fn().mockResolvedValue({ id }),
    });

    it('creates a url-based repository and polls until downloaded', async() => {
      const created = makeRepoModel('repo-1');
      const dispatch = jest.fn()
        .mockResolvedValueOnce(created) // management/create
        .mockResolvedValueOnce({ status: { conditions: [{ type: 'Downloaded', status: 'True' }] } }); // management/find
      const store = { dispatch };

      const result = await createHelmRepository(store, 'my-repo', 'https://example.com/charts');

      expect(result).toStrictEqual({ id: 'repo-1' });
      expect(dispatch).toHaveBeenNthCalledWith(1, 'management/create', {
        type:     'catalog.cattle.io.clusterrepo',
        metadata: { name: 'my-repo' },
        spec:     { url: 'https://example.com/charts' },
      });
      expect(dispatch).toHaveBeenNthCalledWith(2, 'management/find', {
        type: 'catalog.cattle.io.clusterrepo',
        id:   'repo-1',
        opt:  { force: true, watch: false },
      });
    });

    it('creates a git-based repository using branch and gitRepo instead of url', async() => {
      const created = makeRepoModel('repo-2');
      const dispatch = jest.fn()
        .mockResolvedValueOnce(created)
        .mockResolvedValueOnce({ status: { conditions: [{ type: 'Downloaded', status: 'True' }] } });
      const store = { dispatch };

      await createHelmRepository(store, 'git-repo', 'https://example.com/repo.git', 'main');

      expect(dispatch).toHaveBeenNthCalledWith(1, 'management/create', {
        type:     'catalog.cattle.io.clusterrepo',
        metadata: { name: 'git-repo' },
        spec:     { gitBranch: 'main', gitRepo: 'https://example.com/repo.git' },
      });
    });

    it('polls multiple times while the Downloaded condition is not yet True', async() => {
      const created = makeRepoModel('repo-3');
      const dispatch = jest.fn()
        .mockResolvedValueOnce(created)
        .mockResolvedValueOnce({ status: { conditions: [{ type: 'Downloaded', status: 'False' }] } })
        .mockResolvedValueOnce({ status: { conditions: [] } })
        .mockResolvedValueOnce({ status: { conditions: [{ type: 'Downloaded', status: 'True' }] } });
      const store = { dispatch };

      const promise = createHelmRepository(store, 'my-repo', 'https://example.com/charts');

      await jest.advanceTimersByTimeAsync(10000);

      const result = await promise;

      expect(result).toStrictEqual({ id: 'repo-3' });
      expect(dispatch).toHaveBeenCalledTimes(4);
    });

    it('throws once the retry budget is exhausted without a Downloaded condition', async() => {
      const created = makeRepoModel('repo-4');
      const dispatch = jest.fn()
        .mockResolvedValueOnce(created)
        .mockResolvedValue({ status: { conditions: [{ type: 'Downloaded', status: 'False' }] } });
      const store = { dispatch };

      const promise = createHelmRepository(store, 'my-repo', 'https://example.com/charts');

      promise.catch(() => {});

      await jest.advanceTimersByTimeAsync(60000);

      await expect(promise).rejects.toThrow('Failed to add Helm Chart Repository');
    });
  });

  describe('getHelmChart', () => {
    it('returns the chart on success, using the repository info link and chartName', async() => {
      const chart = { name: 'my-chart', version: '1.0.0' };
      const dispatch = jest.fn().mockResolvedValue({ chart });
      const store = { dispatch };
      const repository = { links: { info: '/v1/catalog.cattle.io.clusterrepos/my-repo?link=info' } };

      const result = await getHelmChart(store, repository, 'my-chart');

      expect(result).toStrictEqual(chart);
      expect(dispatch).toHaveBeenCalledWith('management/request', {
        method: 'GET',
        url:    '/v1/catalog.cattle.io.clusterrepos/my-repo?link=info&chartName=my-chart',
      });
    });

    it('retries after a failed request and eventually returns the chart', async() => {
      const chart = { name: 'my-chart' };
      const dispatch = jest.fn()
        .mockRejectedValueOnce(new Error('not ready'))
        .mockResolvedValueOnce({ chart });
      const store = { dispatch };
      const repository = { links: { info: '/info' } };

      const promise = getHelmChart(store, repository, 'my-chart');

      await jest.advanceTimersByTimeAsync(2500);

      const result = await promise;

      expect(result).toStrictEqual(chart);
      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('returns null after exceeding maxRetries', async() => {
      const dispatch = jest.fn().mockRejectedValue(new Error('not ready'));
      const store = { dispatch };
      const repository = { links: { info: '/info' } };

      const promise = getHelmChart(store, repository, 'my-chart');

      await jest.advanceTimersByTimeAsync(30000);

      const result = await promise;

      expect(result).toBeNull();
    });

    it('handles a missing repository links object without throwing', async() => {
      const chart = { name: 'my-chart' };
      const dispatch = jest.fn().mockResolvedValue({ chart });
      const store = { dispatch };

      const result = await getHelmChart(store, undefined, 'my-chart');

      expect(result).toStrictEqual(chart);
      expect(dispatch).toHaveBeenCalledWith('management/request', {
        method: 'GET',
        url:    'undefined&chartName=my-chart',
      });
    });
  });
});
