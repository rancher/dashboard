import { deriveRepoName, fetchAppCoCharts } from '@shell/utils/fleet-appco';

/**
 * Build a fake ClusterRepo resource. Its `waitForTestFn` emulates the real
 * resource-class helper by synchronously polling the provided test function
 * until it returns truthy (or "timing out" after a few attempts).
 */
const buildRepo = (overrides: Record<string, any> = {}) => ({
  metadata:        { state: {} },
  status:          { conditions: [] },
  stateDisplay:    'Active',
  stateBackground: 'bg-success',
  followLink:      jest.fn().mockResolvedValue({ entries: { chartA: [{ name: 'chartA' }] } }),
  waitForTestFn:   (fn: () => boolean) => new Promise<void>((resolve, reject) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (fn()) {
        return resolve();
      }
    }

    reject(new Error('timed out'));
  }),
  ...overrides,
});

const buildStore = (repo: any, { findRejects = false }: { findRejects?: boolean } = {}) => ({
  dispatch: jest.fn((action: string) => {
    if (action.endsWith('/find')) {
      return findRejects ? Promise.reject(new Error('not found')) : Promise.resolve(repo);
    }

    return Promise.resolve();
  }),
  getters: new Proxy({}, {
    get: (_target, prop) => {
      if (String(prop).endsWith('/byId')) {
        return () => repo;
      }

      return undefined;
    }
  }),
});

describe('fleet-appco utils', () => {
  describe('deriveRepoName', () => {
    it.each([
      ['my-auth-secret', 'my-repo-secret'],
      ['auth-token', 'repo-token'],
      ['some-auth', 'some-repo'],
    ])('should replace "auth" with "repo" in %s', (input, expected) => {
      expect(deriveRepoName(input)).toStrictEqual(expected);
    });

    it('should return empty string for empty input', () => {
      expect(deriveRepoName('')).toStrictEqual('');
    });
  });

  describe('fetchAppCoCharts', () => {
    it('should return entries once the repo OCIDownloaded condition is True', async() => {
      const repo = buildRepo({ status: { conditions: [{ type: 'OCIDownloaded', status: 'True' }] } });
      const store = buildStore(repo);
      const onStateChange = jest.fn();

      const result = await fetchAppCoCharts(store as any, 'my-repo', onStateChange);

      expect(result.entries).toStrictEqual({ chartA: [{ name: 'chartA' }] });
      expect(result.repoState).toStrictEqual(expect.objectContaining({
        repoName: 'my-repo', transitioning: false, error: false
      }));
      expect(repo.followLink).toHaveBeenCalledWith('index');
      expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ repoName: 'my-repo', error: false }));
    });

    it('should return no entries and an error state when the repo reports an error', async() => {
      const repo = buildRepo({ metadata: { state: { error: true, message: 'boom' } } });
      const store = buildStore(repo);

      const result = await fetchAppCoCharts(store as any, 'my-repo');

      expect(result.entries).toBeNull();
      expect(result.repoState).toStrictEqual(expect.objectContaining({
        repoName: 'my-repo', error: true, errorMessage: 'boom'
      }));
      expect(repo.followLink).not.toHaveBeenCalled();
    });

    it('should return no entries or state when the repo cannot be found', async() => {
      const repo = buildRepo();
      const store = buildStore(repo, { findRejects: true });

      const result = await fetchAppCoCharts(store as any, 'my-repo');

      expect(result.entries).toBeNull();
      expect(result.repoState).toBeNull();
    });

    it('should stop and return no entries when the signal is aborted', async() => {
      const repo = buildRepo();
      const store = buildStore(repo);
      const controller = new AbortController();

      controller.abort();

      const result = await fetchAppCoCharts(store as any, 'my-repo', undefined, controller.signal);

      expect(result.entries).toBeNull();
      expect(result.repoState).toBeNull();
      expect(repo.followLink).not.toHaveBeenCalled();
    });
  });
});
