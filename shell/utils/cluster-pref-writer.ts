import { CLUSTER, PINNED_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';
import { addRecentCluster } from '@shell/utils/recent-clusters';
import { addObject, removeObject } from '@shell/utils/array';

/**
 * Centralized, serialized writer for the app-bar cluster preferences (pinned + recent). SURE-8192.
 *
 * Each mutator expresses its change as a PURE `apply(currentValue) => newValue` transform and hands it to
 * `commitAndReconcile` (prefs/applyPrefsOptimistic + prefs/reconcilePrefs), which updates the client
 * optimistically (instant UI) and then reconciles: it runs the same transform against the SERVER's live
 * value in the one GET the write needs anyway, so an external
 * change (another tab, a manual edit) is adopted rather than clobbered — the ACTION wins regardless of
 * what was on screen.
 *
 * Everything funnels through `enqueue` so the writes run STRICTLY sequentially — the shared per-user
 * Preference resource is a read-modify-write, so two overlapping GET-then-saves would 409 ("the object has
 * been modified"). Serializing also makes them idempotent (a redundant visit resolves to a no-op PUT).
 */
type Dispatch = (action: string, payload?: any) => Promise<any>;
// The prefs this writer touches are heterogeneous: RECENT/PINNED are string[], CLUSTER is a string.
type PrefValue = string | string[];
// `apply` is a pure transform over the pref's current value; each one narrows to the shape it expects.
type Mutation = { key: string, apply: (value: PrefValue) => PrefValue };

// The RECENT mutation shared by a visit and an unpin: prepend `id`, then strip the non-cluster
// placeholders (`local` / `_`) an older build may have persisted. reconcilePrefs runs this against the
// SERVER's live value, so it can't clobber the persisted list on a cold cache. SURE-8192.
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
 * Apply the shelf mutations: commit the optimistic client change IMMEDIATELY — OUTSIDE the queue — so the
 * derived pinned/recent shelf and its FLIP animation start the instant the user clicks, then SERIALIZE only
 * the server round-trip. `applyPrefsOptimistic` commits synchronously (its promise just carries the values
 * it wrote); `reconcilePrefs` re-applies each transform against the server's live value and merges any
 * external drift. The queue exists because the shared per-user Preference is a read-modify-write, so two
 * overlapping GET-then-PUTs would 409 — but the UI never waits behind it. SURE-8192.
 */
function commitAndReconcile(dispatch: Dispatch, mutations: Mutation[]): Promise<any> {
  const optimistic = dispatch('prefs/applyPrefsOptimistic', mutations);

  return enqueue(() => optimistic.then((o: any) => dispatch('prefs/reconcilePrefs', { mutations, optimistic: o })));
}

/**
 * Record a cluster navigation: remember `id` as the current cluster (CLUSTER pref) AND, for a real
 * cluster, prepend it to the RECENT list — in ONE merge write.
 *
 * These MUST be written together. `loadCluster` runs on every navigation; writing CLUSTER via a separate
 * `prefs/set` alongside the recent write made two racing read-modify-writes on the shared Preference: the
 * set's get-before-set re-committed a stale RECENT over the just-made optimistic update (the shelf flashed
 * back until a reload) and its PUT could clobber the recent write on the server (or 409). Batching them
 * means the single reconcile ignores BOTH keys (no clobber) and persists them in ONE PUT (no race). `local`
 * and `_` (BLANK_CLUSTER) are remembered as the current cluster but never listed under RECENT. SURE-8192.
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
 * Unpin `id`: remove it from PINNED_CLUSTERS and move it to the TOP of RECENT, so the just-unpinned
 * cluster stays visible where the user was looking (rather than reappearing at its old last-seen spot
 * or, if never visited, vanishing entirely). Both prefs change in ONE server round-trip. SURE-8192.
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
