import { LOCAL_CLUSTER } from '@shell/config/types';
import { CLUSTER, MENU_MAX_RECENT_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';

/**
 * Centralized, serialized writer for the app-bar cluster preferences (pinned + recent).
 *
 * Each mutator expresses its change as a pure `apply(current) => next` transform. `commitAndReconcile`
 * applies it optimistically for instant UI, then re-runs it against the server's live value so an
 * external change (another tab, a manual edit) is adopted rather than clobbered. Every write funnels
 * through `enqueue` to run strictly sequentially: the shared per-user Preference is a read-modify-write,
 * so overlapping GET-then-PUTs would 409.
 */
type Dispatch = (action: string, payload?: any) => Promise<any>;
// The prefs this writer touches are heterogeneous: RECENT/PINNED are string[], CLUSTER is a string.
type PrefValue = string | string[];
// `apply` is a pure transform over the pref's current value; each one narrows to the shape it expects.
type Mutation = { key: string, apply: (value: PrefValue) => PrefValue };

/** A real, recordable cluster: `local` and `_` (BLANK_CLUSTER) are the current cluster but never listed under RECENT. */
export function isRecordableCluster(id: string): boolean {
  return !!id && id !== LOCAL_CLUSTER && id !== BLANK_CLUSTER;
}

// RECENT mutation for a visit: prepend `id` most-recent-first (de-duped), then strip empty / non-cluster
// placeholders (`local`, `_`) an older build may have persisted. The stored log is capped — only the first
// MENU_MAX_RECENT_CLUSTERS are ever displayed (`visibleRecentClusters`), and everything past the cap is
// dead weight re-serialized into the shared per-user Preference on every write. 2x the display cap leaves
// headroom for the pinned-exclusion filter.
export const prependRecent = (id: string): Mutation => ({
  key:   RECENT_CLUSTERS,
  apply: (recents) => {
    const current = Array.isArray(recents) ? recents : [];

    return [id, ...current.filter((r) => r !== id)]
      .filter((c) => isRecordableCluster(c))
      .slice(0, MENU_MAX_RECENT_CLUSTERS * 2);
  },
});

let chain: Promise<any> = Promise.resolve();

/** Run `task` after every previously-queued write resolves (regardless of their success/failure). */
function enqueue(task: () => Promise<any>): Promise<any> {
  const run = chain.then(task, task);

  // Keep the chain alive even if a task rejects, so one failed write can't wedge all future writes.
  chain = run.then(() => undefined, () => undefined);

  return run;
}

/**
 * Commit the optimistic client change immediately (outside the queue) so the shelf and its FLIP
 * animation start the instant the user clicks, then serialize only the server round-trip so the UI
 * never waits behind it.
 */
export function commitAndReconcile(dispatch: Dispatch, mutations: Mutation[]): Promise<any> {
  let optimistic: Promise<any>;

  // `applyPrefsOptimistic` is a SYNC Vuex action, and Vuex does not wrap a synchronous throw from one — so
  // its cookie-backed guard would escape `dispatch` past every caller's `.catch` (and take `loadCluster`
  // down with it). Turn it into a rejection, keeping the commit itself synchronous.
  try {
    optimistic = dispatch('prefs/applyPrefsOptimistic', mutations);
  } catch (e) {
    return Promise.reject(e);
  }

  return enqueue(() => optimistic.then((o: any) => dispatch('prefs/reconcilePrefs', { mutations, optimistic: o })));
}

/**
 * Record a cluster navigation: remember `id` as the current cluster (CLUSTER) and, for a real cluster,
 * prepend it to RECENT — batched into ONE write. Writing CLUSTER separately raced two read-modify-writes
 * on the shared Preference (stale RECENT re-committed, clobbered PUTs, 409s); one merge write avoids it.
 * `local` and `_` (BLANK_CLUSTER) are the current cluster but never listed under RECENT.
 */
export function recordClusterNavigation(dispatch: Dispatch, id: string): Promise<any> {
  const mutations: Mutation[] = [{ key: CLUSTER, apply: () => id }];

  if (isRecordableCluster(id)) {
    mutations.push(prependRecent(id));
  }

  return commitAndReconcile(dispatch, mutations);
}
