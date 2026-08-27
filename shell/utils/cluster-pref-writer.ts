import { CLUSTER, PINNED_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';
import { addRecentCluster } from '@shell/utils/recent-clusters';
import { addObject, removeObject } from '@shell/utils/array';

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

// RECENT mutation shared by a visit and an unpin: prepend `id`, then strip non-cluster placeholders
// (`local` / `_`) an older build may have persisted.
const prependRecent = (id: string): Mutation => ({
  key:   RECENT_CLUSTERS,
  apply: (recents) => addRecentCluster(Array.isArray(recents) ? recents : [], id).filter((c) => c && c !== 'local' && c !== BLANK_CLUSTER),
});

let chain: Promise<any> = Promise.resolve();

/** Run `task` after every previously-queued write resolves (regardless of their success/failure). */
export function enqueue(task: () => Promise<any>): Promise<any> {
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
function commitAndReconcile(dispatch: Dispatch, mutations: Mutation[]): Promise<any> {
  const optimistic = dispatch('prefs/applyPrefsOptimistic', mutations);

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

  if (id && id !== 'local' && id !== BLANK_CLUSTER) {
    mutations.push(prependRecent(id));
  }

  return commitAndReconcile(dispatch, mutations);
}

/** Pin `id` (touches PINNED_CLUSTERS only — a pinned cluster is just hidden from RECENT). */
export function pinCluster(dispatch: Dispatch, id: string): Promise<any> {
  return commitAndReconcile(dispatch, [{
    key:   PINNED_CLUSTERS,
    apply: (pinned) => {
      const next = [...(Array.isArray(pinned) ? pinned : [])];

      addObject(next, id);

      return next;
    },
  }]);
}

/**
 * Unpin `id`: remove it from PINNED_CLUSTERS and move it to the TOP of RECENT so the just-unpinned
 * cluster stays visible where the user was looking rather than vanishing or reappearing at its old spot.
 */
export function unpinCluster(dispatch: Dispatch, id: string): Promise<any> {
  const mutations: Mutation[] = [{
    key:   PINNED_CLUSTERS,
    apply: (pinned) => {
      const next = [...(Array.isArray(pinned) ? pinned : [])];

      removeObject(next, id);

      return next;
    },
  }];

  // Surface it at the front of RECENT too, unless it's the non-recordable local/blank placeholder.
  if (id && id !== 'local' && id !== BLANK_CLUSTER) {
    mutations.push(prependRecent(id));
  }

  return commitAndReconcile(dispatch, mutations);
}
