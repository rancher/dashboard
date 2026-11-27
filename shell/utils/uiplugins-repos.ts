import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CATALOG } from '@shell/config/types';
import { UI_PLUGINS_REPOS } from '@shell/config/uiplugins';
import { NotificationLevel } from '@shell/types/notifications';

export type ClusterRepo = any;

const EXTENSION_REPO_URLS = [UI_PLUGINS_REPOS.OFFICIAL.URL, UI_PLUGINS_REPOS.PARTNERS.URL];
const EXTENSION_REPO_NAMES = [UI_PLUGINS_REPOS.OFFICIAL.NAME, UI_PLUGINS_REPOS.PARTNERS.NAME];

/**
 * Message Rancher parks on the `Downloaded` condition while a git repository is being cloned, as
 * of 2.16. It is written with `SetError`, so the condition reads as a failure even though nothing
 * has gone wrong - this is the only thing that tells the two apart. Older Rancher sets no
 * condition at all until the download finishes, which `repoDownloadState` handles by treating a
 * missing condition as "still going".
 */
const DOWNLOADING_PLACEHOLDER = 'downloading';

const DOWNLOAD_CONDITIONS = ['Downloaded', 'OCIDownloaded'];

/** Repositories take a while to clone, and the big ones take minutes. */
const REPO_WAIT_TIMEOUT = 15 * 60 * 1000;
const REPO_WAIT_INTERVAL = 2000;

/**
 * Repositories we have promised to report on but have not yet.
 *
 * The wait runs in the page that added them, so on its own it dies with the first reload, full
 * navigation or session timeout - and the Extensions banner has already promised a notification
 * by then. Keeping the names outside the page lets the wait be picked up again on the next load,
 * so the promise survives the user going away and coming back.
 */
const PENDING_REPOS_KEY = 'extension-repos-awaiting-download';

/**
 * How long to keep picking a repository's download back up. A repository that is simply slow is
 * worth resuming across page loads, but one that never succeeds and is never removed would
 * otherwise restart a wait on every load for the life of the browser profile.
 */
const PENDING_REPOS_TTL = 24 * 60 * 60 * 1000;

export type RepoDownloadState = {
  /**
   * `ready` - the index exists, so the repository's extensions can be listed.
   * `downloading` - no index yet, and nothing has reported a failure.
   * `failed` - Rancher could not produce an index.
   */
  state: 'ready' | 'downloading' | 'failed';
  /**
   * Rancher's own error text, only set when `state` is `failed`. It already ends with
   * ". Will retry after <duration>" whenever another attempt is coming, so callers reporting this
   * do not need to work the retry out for themselves.
   */
  message: string;
  /**
   * Set by `waitForRepoDownload` when it stopped because the repository no longer exists, as
   * opposed to running out of time on one that is still going.
   */
  gone?: boolean;
};

/**
 * Any cluster repo can be added for reasons that have nothing to do with extensions, and until its
 * index exists there is no way to tell whether it holds any. Callers that report on repositories
 * before they have an index use this so that an unrelated chart repo stays out of it.
 *
 * In an airgapped install the extension repositories are mirrored internally, so their URLs no
 * longer point at github.com/rancher. Fall back to the well-known names in that case only, so a
 * third-party repo cannot claim the official name in a connected install. Same approach as
 * `isAirgapMirror` on the ClusterRepo model.
 */
export function isExtensionRepo(repo: ClusterRepo): boolean {
  if (EXTENSION_REPO_URLS.includes(repo?.urlDisplay)) {
    return true;
  }

  return !!repo?.isAirgap && EXTENSION_REPO_NAMES.includes(repo?.metadata?.name);
}

/**
 * Repositories that are ours to report on - extension repositories that are enabled and not
 * hidden. A disabled repository is not being downloaded and is not broken, it is just off.
 */
export function isReportableExtensionRepo(repo: ClusterRepo): boolean {
  return isExtensionRepo(repo) &&
    !repo?._isClusterRepoDisabled &&
    repo?.metadata?.annotations?.[CATALOG_ANNOTATIONS.HIDDEN_REPO] !== 'true';
}

/**
 * Where a repository is up to, from the UI's point of view: can its extensions be listed yet, and
 * if not, is that because it is still working or because it gave up?
 *
 * `status.nextRetryAt` looks like the obvious failure signal but is not usable - Rancher clears it
 * both when the retry budget is exhausted and for errors it will not retry, which are exactly the
 * cases that matter most. The download conditions are the reliable source, and their message
 * already carries the retry when there is one.
 */
export function repoDownloadState(repo: ClusterRepo): RepoDownloadState {
  if (repo?.status?.indexConfigMapName) {
    return { state: 'ready', message: '' };
  }

  const conditions = repo?.status?.conditions || [];

  const failure = conditions.find((c: any) => {
    if (!DOWNLOAD_CONDITIONS.includes(c?.type) || `${ c?.status }` !== 'False') {
      return false;
    }

    return `${ c?.message || '' }`.trim().toLowerCase() !== DOWNLOADING_PLACEHOLDER;
  });

  if (failure) {
    return { state: 'failed', message: `${ failure.message || '' }`.trim() };
  }

  return { state: 'downloading', message: '' };
}

/**
 * Identity of a repository's index. Rancher writes `indexConfigMapName` and `downloadTime` in the
 * same status update when it publishes one, so this changes exactly when a repository's charts
 * first become fetchable, and again whenever they are replaced.
 *
 * `indexConfigMapResourceVersion` would be the natural choice but is never persisted: the
 * controller reads it off a ConfigMap it built in memory rather than the applied one, so it is
 * always empty and `omitempty` drops it.
 */
export function repoIndexId(repo: ClusterRepo): string {
  return `${ repo?._key }|${ repo?.status?.indexConfigMapName || '' }|${ repo?.status?.downloadTime || '' }`;
}

/**
 * The repository as the store currently sees it, or `null` once it is gone for good.
 *
 * The lookup has to be awaited and its failure handled. Steve rejects with a plain response
 * object rather than an Error, so letting it escape gives an unhandled rejection that the dev
 * server reports as `[object Object]` - once every poll, for the whole wait.
 */
async function repoFromStore(store: any, name: string): Promise<ClusterRepo | null> {
  const repo = store.getters['management/byId'](CATALOG.CLUSTER_REPO, name);

  if (repo) {
    return repo;
  }

  // Leaving the Extensions page forgets the type, so re-find it rather than giving up. `find`
  // re-registers the watch, which is what keeps the resource current while we wait below.
  try {
    return await store.dispatch('management/find', {
      type: CATALOG.CLUSTER_REPO,
      id:   name,
      opt:  { force: true }
    }) || null;
  } catch {
    // Deleted, or no longer readable - either way there is nothing left to wait for
    return null;
  }
}

/** Repository name to the time we started promising, so stale entries can age out. */
type PendingRepos = Record<string, number>;

function readPendingEntries(): PendingRepos {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PENDING_REPOS_KEY) || '{}');
    const cutoff = Date.now() - PENDING_REPOS_TTL;
    const fresh: PendingRepos = {};

    Object.entries(parsed || {}).forEach(([name, since]) => {
      if (typeof name === 'string' && typeof since === 'number' && since > cutoff) {
        fresh[name] = since;
      }
    });

    return fresh;
  } catch {
    // Absent, unreadable or written by an older version - start clean
    return {};
  }
}

function writePendingEntries(entries: PendingRepos): void {
  try {
    if (Object.keys(entries).length) {
      window.localStorage.setItem(PENDING_REPOS_KEY, JSON.stringify(entries));
    } else {
      window.localStorage.removeItem(PENDING_REPOS_KEY);
    }
  } catch {
    // Private browsing, or storage full - the in-page wait still works, it just will not resume
  }
}

/** Names of repositories whose download we have promised to report on. Never throws. */
export function readPendingRepos(): string[] {
  return Object.keys(readPendingEntries());
}

function rememberPendingRepo(name: string): void {
  const entries = readPendingEntries();

  // Keep the original time, so resuming does not refresh the expiry indefinitely
  writePendingEntries({ ...entries, [name]: entries[name] ?? Date.now() });
}

function forgetPendingRepo(name: string): void {
  const entries = readPendingEntries();

  delete entries[name];

  writePendingEntries(entries);
}

/**
 * Pick up any repository we promised to report on but never did, because the page that was
 * waiting went away. Safe to call on every load: a repository that is already finished resolves
 * on the first check, and one that has been deleted is simply dropped.
 */
export function resumePendingRepoDownloads(store: any): void {
  readPendingRepos().forEach((name) => {
    notifyRepoDownload(store, name)
      .catch((e) => console.error('Failed to report extension repository download', e)); // eslint-disable-line no-console
  });
}

/**
 * Confirm through the Notification Centre once a newly added repository's extensions are ready, so
 * the user can leave the page and still be told.
 *
 * Only the confirmation is a notification. A repository that is downloading, or that failed, is
 * reported by the Extensions page itself - saying it twice adds nothing, and a notification for
 * work still in progress outlives the page that would have resolved it.
 *
 * Runs detached from whatever component started it - it must outlive the dialog that triggers it.
 */
export async function notifyRepoDownload(store: any, repoName: string): Promise<void> {
  rememberPendingRepo(repoName);

  const settled = await waitForRepoDownload(store, repoName);

  if (settled.state !== 'ready') {
    // Only stop promising once the repository is gone. Still downloading after the deadline means
    // the next load should pick the wait up again rather than leave the banner's promise unkept.
    if (settled.gone) {
      forgetPendingRepo(repoName);
    }

    return;
  }

  forgetPendingRepo(repoName);

  const t = store.getters['i18n/t'];
  const repo = store.getters['management/byId'](CATALOG.CLUSTER_REPO, repoName);

  return store.dispatch('notifications/add', {
    id:            `extension-repo-download-${ repoName }`,
    level:         NotificationLevel.Success,
    title:         t('plugins.repoDownload.ready.title'),
    message:       t('plugins.repoDownload.ready.message', { name: repo?.nameDisplay || repoName }),
    primaryAction: {
      label: t('plugins.repoDownload.ready.action'),
      route: { name: 'c-cluster-uiplugins', params: { cluster: 'local' } }
    }
  });
}

/**
 * Resolves once the repository has an index. A download failure is not an ending - Rancher
 * retries on its own, and the Extensions page reports the failure in the meantime - so keep
 * waiting until it succeeds, the repository goes away, or the deadline passes.
 */
export async function waitForRepoDownload(store: any, repoName: string): Promise<RepoDownloadState> {
  const deadline = Date.now() + REPO_WAIT_TIMEOUT;

  while (Date.now() < deadline) {
    const repo = await repoFromStore(store, repoName);

    // Removed while we were waiting, so stop rather than poll a repository that cannot return
    if (!repo) {
      return {
        state: 'failed', message: '', gone: true
      };
    }

    if (repoDownloadState(repo).state === 'ready') {
      return { state: 'ready', message: '' };
    }

    await new Promise((resolve) => setTimeout(resolve, REPO_WAIT_INTERVAL));
  }

  // Out of time on a repository that still exists - it may yet finish, so this is not `gone`
  return { state: 'failed', message: '' };
}
