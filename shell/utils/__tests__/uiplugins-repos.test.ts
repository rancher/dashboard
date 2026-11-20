import {
  isExtensionRepo,
  isReportableExtensionRepo,
  repoDownloadState,
  repoIndexId,
  notifyRepoDownload,
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
});
