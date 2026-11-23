import {
  isExtensionRepo,
  isReportableExtensionRepo,
  repoDownloadState,
  repoIndexId,
  notifyRepoDownload,
  waitForRepoDownload,
  readPendingRepos,
  resumePendingRepoDownloads,
} from '@shell/utils/uiplugins-repos';
import { UI_PLUGINS_REPOS } from '@shell/config/uiplugins';
import { NotificationLevel } from '@shell/types/notifications';

const repoOf = (overrides: any = {}) => ({
  _key:       'uid-1',
  id:         'repo-1',
  urlDisplay: UI_PLUGINS_REPOS.OFFICIAL.URL,
  isAirgap:   false,
  metadata:   { name: 'repo-1' },
  status:     {},
  ...overrides,
});

describe('fx: isExtensionRepo', () => {
  it.each<any[]>([
    ['the official repository', { urlDisplay: UI_PLUGINS_REPOS.OFFICIAL.URL }, true],
    ['the partners repository', { urlDisplay: UI_PLUGINS_REPOS.PARTNERS.URL }, true],
    ['the community repository', { urlDisplay: UI_PLUGINS_REPOS.COMMUNITY.URL }, false],
    ['an unrelated chart repository', { urlDisplay: 'https://example.com/charts' }, false],
  ])('should recognise %s by url', (_label, overrides, expected) => {
    expect(isExtensionRepo(repoOf(overrides))).toBe(expected);
  });

  it.each<any[]>([
    ['the mirrored official repository in airgap', UI_PLUGINS_REPOS.OFFICIAL.NAME, true, true],
    ['the mirrored partners repository in airgap', UI_PLUGINS_REPOS.PARTNERS.NAME, true, true],
    // Anyone can name a repo this, so the name alone must not be enough outside airgap
    ['a repository claiming the official name outside airgap', UI_PLUGINS_REPOS.OFFICIAL.NAME, false, false],
    ['an unrelated mirrored repository', 'my-charts', true, false],
  ])('should handle %s', (_label, name, isAirgap, expected) => {
    const repo = repoOf({
      urlDisplay: 'https://git.internal.example.com/mirror', isAirgap, metadata: { name }
    });

    expect(isExtensionRepo(repo)).toBe(expected);
  });

  it('should cope with a repository that has no metadata at all', () => {
    expect(isExtensionRepo({ isAirgap: true })).toBe(false);
    expect(isExtensionRepo(undefined)).toBe(false);
  });
});

describe('fx: isReportableExtensionRepo', () => {
  it.each<any[]>([
    ['an enabled, visible extension repository', {}, true],
    ['a disabled repository', { _isClusterRepoDisabled: true }, false],
    ['a hidden repository', { metadata: { name: 'repo-1', annotations: { 'clusterrepo.cattle.io/hidden': 'true' } } }, false],
  ])('should report on %s', (_label, overrides, expected) => {
    expect(isReportableExtensionRepo(repoOf(overrides))).toBe(expected);
  });
});

describe('fx: repoDownloadState', () => {
  it('should be ready once an index exists, whatever the conditions say', () => {
    const repo = repoOf({
      status: {
        indexConfigMapName: 'repo-1-0-abc',
        // A later refresh failed, but the charts from the existing index are still installable
        conditions:         [{
          type: 'Downloaded', status: 'False', message: 'connection refused'
        }],
      }
    });

    expect(repoDownloadState(repo)).toStrictEqual({ state: 'ready', message: '' });
  });

  it.each<any[]>([
    // 2.16+ writes this placeholder with SetError, so the condition reads False while the clone
    // is simply still running
    ['the 2.16 downloading placeholder', [{
      type: 'Downloaded', status: 'False', message: 'downloading'
    }]],
    ['the placeholder in a different case', [{
      type: 'Downloaded', status: 'False', message: ' Downloading '
    }]],
    // Rancher before 2.16 sets no condition until the download finishes
    ['no conditions', []],
    ['a missing conditions array', undefined],
    ['an unrelated failing condition', [{
      type: 'SomethingElse', status: 'False', message: 'boom'
    }]],
  ])('should be downloading with %s', (_label, conditions) => {
    expect(repoDownloadState(repoOf({ status: { conditions } }))).toStrictEqual({ state: 'downloading', message: '' });
  });

  it.each<any[]>([
    ['Downloaded', 'Downloaded'],
    ['OCIDownloaded', 'OCIDownloaded'],
  ])('should be failed on a %s condition carrying a real error', (_label, type) => {
    const repo = repoOf({
      status: {
        conditions: [{
          type, status: 'False', message: 'repository not found'
        }]
      }
    });

    expect(repoDownloadState(repo)).toStrictEqual({ state: 'failed', message: 'repository not found' });
  });

  it('should keep the retry Rancher wrote into its own message', () => {
    // Rancher appends this itself in `setConditionWithInterval`, so the message is already enough
    // to tell the user another attempt is coming - nothing needs to work it out from nextRetryAt
    const repo = repoOf({
      status: {
        nextRetryAt: '2026-11-19T14:32:10Z',
        conditions:  [{
          type: 'Downloaded', status: 'False', message: 'fetch: couldn\'t find remote ref "nope". Will retry after 5m55s'
        }],
      }
    });

    expect(repoDownloadState(repo)).toStrictEqual({ state: 'failed', message: 'fetch: couldn\'t find remote ref "nope". Will retry after 5m55s' });
  });

  it('should be failed without a retry scheduled', () => {
    // Rancher clears nextRetryAt when the retry budget is spent and for non-retriable errors, and
    // leaves the retry off the message too
    const repo = repoOf({
      status: {
        nextRetryAt: undefined,
        conditions:  [{
          type: 'Downloaded', status: 'False', message: 'no such host'
        }],
      }
    });

    expect(repoDownloadState(repo)).toStrictEqual({ state: 'failed', message: 'no such host' });
  });

  it('should be ready for a healthy repository', () => {
    const repo = repoOf({
      status: {
        indexConfigMapName: 'repo-1-0-abc',
        conditions:         [{ type: 'Downloaded', status: 'True' }],
      }
    });

    expect(repoDownloadState(repo)).toStrictEqual({ state: 'ready', message: '' });
  });
});

describe('fx: repoIndexId', () => {
  it('should change when an index is first published', () => {
    const before = repoIndexId(repoOf());
    const after = repoIndexId(repoOf({ status: { indexConfigMapName: 'cm', downloadTime: 't1' } }));

    expect(before).not.toBe(after);
  });

  it('should change when an existing index is replaced', () => {
    const before = repoIndexId(repoOf({ status: { indexConfigMapName: 'cm', downloadTime: 't1' } }));
    const after = repoIndexId(repoOf({ status: { indexConfigMapName: 'cm', downloadTime: 't2' } }));

    expect(before).not.toBe(after);
  });

  it('should not change when something unrelated changes', () => {
    const status = { indexConfigMapName: 'cm', downloadTime: 't1' };

    expect(repoIndexId(repoOf({ status }))).toBe(repoIndexId(repoOf({ status, urlDisplay: 'https://moved' })));
  });
});

describe('fx: notifyRepoDownload', () => {
  const storeWith = (repo: any) => {
    const dispatch = jest.fn((..._args: any[]) => Promise.resolve());

    return {
      dispatch,
      getters: {
        'i18n/t':          (key: string, args: any) => (args?.name ? `${ key }:${ args.name }` : key),
        'management/byId': () => repo,
      },
    };
  };

  it('should say nothing until the index lands, then confirm', async() => {
    const repo = { status: {} as any, nameDisplay: 'Rancher Extensions' };
    const store = storeWith(repo);

    const done = notifyRepoDownload(store, 'repo-1');

    // Nothing is announced while the download is in flight: the Extensions page reports that
    // itself, and a notification for work in progress outlives the page that would resolve it
    expect(store.dispatch).not.toHaveBeenCalled();

    repo.status = { indexConfigMapName: 'cm' };
    await done;

    expect(store.dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: 'extension-repo-download-repo-1', level: NotificationLevel.Success }));
  });

  it('should keep waiting through a failure, since Rancher retries on its own', async() => {
    const repo = {
      nameDisplay: 'Partner Extensions',
      status:      {
        conditions: [{
          type: 'Downloaded', status: 'False', message: 'no such host'
        }]
      } as any,
    };
    const store = storeWith(repo);

    const done = notifyRepoDownload(store, 'repo-1');

    // Long enough for a second poll - a failure must not end the wait
    await new Promise((resolve) => setTimeout(resolve, 2500));

    expect(store.dispatch).not.toHaveBeenCalled();

    repo.status = { indexConfigMapName: 'cm' };
    await done;

    expect(store.dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ level: NotificationLevel.Success }));
  }, 10000);

  it('should name the repository the way the user sees it', async() => {
    const store = storeWith({ status: { indexConfigMapName: 'cm' }, nameDisplay: 'Rancher Extensions' });

    await notifyRepoDownload(store, 'rancher-ui-plugins');

    const added = store.dispatch.mock.calls.find((c: any) => c[0] === 'notifications/add')?.[1];

    expect(added.message).toBe('plugins.repoDownload.ready.message:Rancher Extensions');
  });

  it('should link the confirmation to the extensions page', async() => {
    const store = storeWith({ status: { indexConfigMapName: 'cm' } });

    await notifyRepoDownload(store, 'repo-1');

    const added = store.dispatch.mock.calls.find((c: any) => c[0] === 'notifications/add')?.[1];

    expect(added.primaryAction.route).toStrictEqual({ name: 'c-cluster-uiplugins', params: { cluster: 'local' } });
  });

  describe('a repository that goes away while we wait', () => {
    /**
     * The store is not holding the repository and the lookup fails, which is what happens once it
     * has been deleted or the session has expired. Steve rejects with a plain response object.
     */
    const storeWithMissingRepo = () => {
      // Rejecting with a plain object is exactly what the store does, and is why the browser
      // reports `[object Object]`
      /* eslint-disable-next-line prefer-promise-reject-errors */
      const dispatch = jest.fn((action: string) => (action === 'management/find' ? Promise.reject({ status: 404, message: 'not found' }) : Promise.resolve()));

      return {
        dispatch,
        getters: {
          'i18n/t':          (key: string) => key,
          'management/byId': () => undefined,
        },
      };
    };

    it('should give up instead of polling a repository that cannot come back', async() => {
      const store = storeWithMissingRepo();

      await expect(waitForRepoDownload(store, 'repo-1')).resolves.toStrictEqual({
        state: 'failed', message: '', gone: true
      });

      // One attempt, not one every poll interval for the whole deadline
      expect(store.dispatch.mock.calls.filter((c: any) => c[0] === 'management/find')).toHaveLength(1);
    });

    it('should not leave the failed lookup as an unhandled rejection', async() => {
      // An unawaited, uncaught `management/find` surfaces in the browser as `[object Object]`,
      // repeated once per poll for the length of the wait
      const unhandled: any[] = [];
      const onUnhandled = (reason: any) => unhandled.push(reason);

      process.on('unhandledRejection', onUnhandled);

      await notifyRepoDownload(storeWithMissingRepo(), 'repo-1');
      await new Promise((resolve) => setTimeout(resolve, 0));

      process.off('unhandledRejection', onUnhandled);

      expect(unhandled).toStrictEqual([]);
    });

    it('should not announce a repository that never arrived', async() => {
      const store = storeWithMissingRepo();

      await notifyRepoDownload(store, 'repo-1');

      expect(store.dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());
    });
  });
});

describe('fx: resumePendingRepoDownloads', () => {
  const PENDING_KEY = 'extension-repos-awaiting-download';

  const storeFor = (repo: any) => ({
    dispatch: jest.fn((..._args: any[]) => Promise.resolve()),
    getters:  {
      'i18n/t':          (key: string) => key,
      'management/byId': () => repo,
    },
  });

  beforeEach(() => window.localStorage.removeItem(PENDING_KEY));
  afterEach(() => window.localStorage.removeItem(PENDING_KEY));

  it('should remember a repository while its download is outstanding', async() => {
    const store = storeFor({ status: {} });

    // Not awaited - it is still waiting on a repository that never becomes ready
    notifyRepoDownload(store, 'repo-1');
    await Promise.resolve();

    expect(readPendingRepos()).toStrictEqual(['repo-1']);
  });

  it('should stop remembering one it has reported on', async() => {
    const store = storeFor({ status: { indexConfigMapName: 'cm' } });

    await notifyRepoDownload(store, 'repo-1');

    expect(readPendingRepos()).toStrictEqual([]);
  });

  it('should pick up a repository the previous page never got to report', async() => {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify({ 'repo-1': Date.now() }));
    const store = storeFor({ status: { indexConfigMapName: 'cm' } });

    resumePendingRepoDownloads(store);
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }

    expect(store.dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: 'extension-repo-download-repo-1', level: NotificationLevel.Success }));
    expect(readPendingRepos()).toStrictEqual([]);
  });

  it('should do nothing when there is nothing outstanding', () => {
    const store = storeFor({ status: {} });

    resumePendingRepoDownloads(store);

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it.each([
    ['not valid json', '{nope'],
    ['the wrong shape', '"repo-1"'],
    ['an entry with no timestamp', '{"repo-1":null}'],
  ])('should survive %s in storage', (_label, raw) => {
    window.localStorage.setItem(PENDING_KEY, raw);

    expect(readPendingRepos()).toStrictEqual([]);
  });

  it('should stop resuming a repository that has been pending for too long', () => {
    const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);

    window.localStorage.setItem(PENDING_KEY, JSON.stringify({ 'repo-1': twoDaysAgo, 'repo-2': Date.now() }));

    // Otherwise a repository that never succeeds and is never deleted restarts a wait on every
    // page load, forever
    expect(readPendingRepos()).toStrictEqual(['repo-2']);
  });

  it('should keep a slow repository pending when the wait runs out of time', async() => {
    // Running out of time is not an ending - the next page load should pick the wait back up,
    // otherwise the banner's promise of a notification is quietly dropped
    jest.useFakeTimers();

    const settled = notifyRepoDownload(storeFor({ status: {} }), 'repo-1');

    await jest.advanceTimersByTimeAsync(16 * 60 * 1000);
    await settled;
    jest.useRealTimers();

    expect(readPendingRepos()).toStrictEqual(['repo-1']);
  });

  it('should not let resuming push the expiry further out', async() => {
    const anHourAgo = Date.now() - (60 * 60 * 1000);

    window.localStorage.setItem(PENDING_KEY, JSON.stringify({ 'repo-1': anHourAgo }));

    // Still downloading, so it stays pending - but with its original timestamp
    notifyRepoDownload(storeFor({ status: {} }), 'repo-1');
    await Promise.resolve();

    const stored = JSON.parse(window.localStorage.getItem(PENDING_KEY) || '{}');

    expect(stored['repo-1']).toBe(anHourAgo);
  });
});
