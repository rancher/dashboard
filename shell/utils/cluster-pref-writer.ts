import { PINNED_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';
import { addRecentCluster } from '@shell/utils/recent-clusters';
import { addObject, removeObject } from '@shell/utils/array';

/**
 * Centralized, serialized writer for the app-bar cluster preferences (pinned + recent). SURE-8192.
 *
 * Each mutator expresses its change as a PURE `apply(currentValue) => newValue` transform and hands it to
 * `prefs/setMerge`, which updates the client optimistically (instant UI) and then reconciles: it runs the
 * same transform against the SERVER's live value in the one GET the write needs anyway, so an external
 * change (another tab, a manual edit) is adopted rather than clobbered — the ACTION wins regardless of
 * what was on screen.
 *
 * Everything funnels through `enqueue` so the writes run STRICTLY sequentially — the shared per-user
 * Preference resource is a read-modify-write, so two overlapping GET-then-saves would 409 ("the object has
 * been modified"). Serializing also makes them idempotent (a redundant visit resolves to a no-op PUT).
 */
type Getters = { [key: string]: any };
type Dispatch = (action: string, payload?: any) => Promise<any>;
type Mutation = { key: string, apply: (value: string[]) => string[] };

// The RECENT mutation shared by a visit and an unpin: prepend `id`, then strip the non-cluster
// placeholders (`local` / `_`) an older build may have persisted. prefs/setMerge runs this against the
// SERVER's live value, so it can't clobber the persisted list on a cold cache. SURE-8192.
const prependRecent = (id: string): Mutation => ({
  key:   RECENT_CLUSTERS,
  apply: (recents) => addRecentCluster(recents || [], id).filter((c) => c && c !== 'local' && c !== BLANK_CLUSTER),
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
 * Record a visit to `id` at the front of the RECENT list. No-op (no PUT) when the list is unchanged,
 * so a double cluster-load does not produce a second racing write. Pinned status is irrelevant here.
 */
export function recordClusterVisit(getters: Getters, dispatch: Dispatch, id: string): Promise<any> {
  // `local` is the fixed top tile (its own slice), never listed under RECENT — so don't record it.
  // `_` (BLANK_CLUSTER) is the global / no-cluster route placeholder (e.g. /c/_/... on pages that
  // "require" a cluster param but aren't scoped to one) — it isn't a real cluster, so skip it too.
  if (!id || id === 'local' || id === BLANK_CLUSTER) {
    return Promise.resolve();
  }

  return commitAndReconcile(dispatch, [prependRecent(id)]);
}

/** Pin `id` (touches PINNED_CLUSTERS only — a pinned cluster is just hidden from RECENT). */
export function pinCluster(getters: Getters, dispatch: Dispatch, id: string): Promise<any> {
  return commitAndReconcile(dispatch, [{
    key:   PINNED_CLUSTERS,
    apply: (pinned: string[]) => {
      const next = [...(pinned || [])];

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
export function unpinCluster(getters: Getters, dispatch: Dispatch, id: string): Promise<any> {
  const mutations: Mutation[] = [{
    key:   PINNED_CLUSTERS,
    apply: (pinned) => {
      const next = [...(pinned || [])];

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
