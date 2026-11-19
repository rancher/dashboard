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

function repoFromStore(store: any, name: string): ClusterRepo {
  const repo = store.getters['management/byId'](CATALOG.CLUSTER_REPO, name);

  if (!repo) {
    // Leaving the Extensions page forgets the type, so re-find it rather than giving up. `find`
    // re-registers the watch, which is what keeps the resource current while we wait below.
    store.dispatch('management/find', {
      type: CATALOG.CLUSTER_REPO,
      id:   name,
      opt:  { force: true }
    });
  }

  return repo;
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
  if ((await waitForRepoDownload(store, repoName)).state !== 'ready') {
    return;
  }

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
 * Resolves once the repository has an index. A failure is not an ending - Rancher retries on its
 * own, and the Extensions page reports the failure in the meantime - so keep waiting until it
 * either succeeds or the deadline passes.
 */
export async function waitForRepoDownload(store: any, repoName: string): Promise<RepoDownloadState> {
  const deadline = Date.now() + REPO_WAIT_TIMEOUT;

  while (Date.now() < deadline) {
    const repo = repoFromStore(store, repoName);

    if (repo && repoDownloadState(repo).state === 'ready') {
      return { state: 'ready', message: '' };
    }

    await new Promise((resolve) => setTimeout(resolve, REPO_WAIT_INTERVAL));
  }

  return { state: 'failed', message: '' };
}
