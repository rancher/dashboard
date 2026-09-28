import {
  CLUSTER, PINNED_CLUSTERS, RECENT_CLUSTERS, RECENT_CLUSTERS_FETCHED, enqueuePreferenceWrite
} from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';

/**
 * Serialized writer for the app-bar cluster preferences (pinned + recent).
 *
 * Each change is a pure `apply(current) => next`, committed optimistically and then re-run against what
 * the server holds, so another tab's change is merged rather than overwritten. That merge happens ON
 * WRITE: preferences are not watched, so another tab's pin arrives on this tab's next write or on reload.
 */
type Dispatch = (action: string, payload?: any) => Promise<any>;
// RECENT/PINNED are string[], CLUSTER is a string.
type PrefValue = string | string[];
// `apply` is pure over the pref's current value.
type Mutation = { key: string, apply: (value: PrefValue) => PrefValue };

/** `_` is a placeholder, not somewhere the user went. `local` is a cluster like any other. */
function isRecordableCluster(id: string): boolean {
  return !!id && id !== BLANK_CLUSTER;
}

// Prepend most-recent-first, de-duped, stripping placeholders an older build may have persisted.
export const prependRecent = (id: string): Mutation => ({
  key:   RECENT_CLUSTERS,
  apply: (recents) => {
    const current = Array.isArray(recents) ? recents : [];

    return [id, ...current.filter((r) => r !== id)]
      .filter((c) => isRecordableCluster(c))
      .slice(0, RECENT_CLUSTERS_FETCHED);
  },
});

// A drag says one thing — put THIS cluster at THIS position — so that is all the write carries. Sending
// the shelf's whole order instead would assert the rest of the list too, and overwrite an order another
// tab had moved on to; everything the drag did not touch keeps the place the server has for it.
export const movePinned = (id: string, index: number, onShelf: string[]): Mutation => ({
  key:   PINNED_CLUSTERS,
  apply: (pinned) => {
    const current = Array.isArray(pinned) ? pinned : [];

    // Unpinned elsewhere while the drag was in flight — a reorder must not bring it back.
    if (!current.includes(id)) {
      return current;
    }

    const rest = current.filter((pin) => pin !== id);
    // `index` counts SHELF rows, and the pref holds ids the shelf never renders — `local`, and any cluster
    // whose data has not loaded. Landing on the id that should follow keeps those out of the count; using
    // the index against the pref itself puts the row in the wrong place, or nowhere.
    const following = rest.filter((pin) => onShelf.includes(pin))[Math.max(0, index)];
    const at = following === undefined ? rest.length : rest.indexOf(following);

    return [...rest.slice(0, at), id, ...rest.slice(at)];
  },
});

// Declared locally so this writer stays free of component/composable imports.
type Translate = (key: string, args?: unknown, raw?: boolean) => string;
// The store rather than a bare `dispatch`, so the lookup stays inside the failure branch — callers mount
// without a store in their tests.
type Growler = { dispatch: Dispatch };

/** A failed write RESOLVES with `{ type, status }`, and by then the optimistic commit is already on
 * screen — so it has to be surfaced, the same way from every surface that pins. */
export function reportPinWriteFailure(store: Growler, t: Translate, write: Promise<any> | any): Promise<void> {
  return Promise.resolve(write)
    .then((result: any) => {
      if (result?.status) {
        // `stringify` would dump the bare `{ type, status }` as JSON — give it a message instead.
        store.dispatch('growl/fromError', {
          title: t('nav.pinClusterError'),
          err:   { ...result, message: t('nav.pinClusterError') },
        });
      }
    })
    // Nothing in the write rejects by contract; this is only so an unexpected throw isn't swallowed.
    .catch((e) => console.warn('Unable to toggle the cluster pin', e)); // eslint-disable-line no-console
}

/** Commits immediately, outside the queue, so the shelf moves on click; only the round-trip is queued. */
export function commitAndReconcile(dispatch: Dispatch, mutations: Mutation[]): Promise<any> {
  // The optimistic phase is sync, so the client commit lands in this tick. It reports failure by RESOLVING
  // with `{ type, status }` and has committed nothing, so there is nothing left to reconcile.
  const optimistic = dispatch('prefs/applyPrefsOptimistic', mutations);

  return enqueuePreferenceWrite(() => optimistic.then((o: any) => (
    o?.status ? o : dispatch('prefs/reconcilePrefs', { mutations, optimistic: o })
  )));
}

/**
 * Record a cluster navigation: remember `id` as the current cluster (CLUSTER) and, for a real cluster,
 * prepend it to RECENT — batched into ONE write. Writing CLUSTER separately raced two read-modify-writes
 * on the shared Preference (stale RECENT re-committed, clobbered PUTs, 409s); one merge write avoids it.
 * `_` (BLANK_CLUSTER) is recorded as the current cluster but never listed under RECENT — it is a
 * placeholder, not somewhere the user went.
 */
export function recordClusterNavigation(dispatch: Dispatch, id: string): Promise<any> {
  const mutations: Mutation[] = [{ key: CLUSTER, apply: () => id }];

  if (isRecordableCluster(id)) {
    mutations.push(prependRecent(id));
  }

  return commitAndReconcile(dispatch, mutations);
}
