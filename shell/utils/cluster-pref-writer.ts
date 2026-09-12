import {
  CLUSTER, PINNED_CLUSTERS, RECENT_CLUSTERS, RECENT_CLUSTERS_FETCHED, enqueuePreferenceWrite
} from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';

/**
 * Centralized, serialized writer for the app-bar cluster preferences (pinned + recent).
 *
 * Each mutator expresses its change as a pure `apply(current) => next` transform. `commitAndReconcile`
 * applies it optimistically for instant UI, then re-runs it against what the server holds when the write
 * goes out, so a change made elsewhere (another tab, a manual edit) is merged rather than overwritten.
 *
 * That merge happens ON WRITE only. Preferences are not watched, so a cluster pinned in another tab does
 * not arrive here on its own: it shows up when this tab next writes a preference, or on reload.
 *
 * The server round-trip goes through the prefs store's shared write queue, which every preference write
 * shares — including the plain `prefs/set` calls this writer knows nothing about.
 */
type Dispatch = (action: string, payload?: any) => Promise<any>;
// The prefs this writer touches are heterogeneous: RECENT/PINNED are string[], CLUSTER is a string.
type PrefValue = string | string[];
// `apply` is a pure transform over the pref's current value; each one narrows to the shape it expects.
type Mutation = { key: string, apply: (value: PrefValue) => PrefValue };

/** A real cluster worth recording a visit to. `_` (BLANK_CLUSTER) is a placeholder, not somewhere the
 * user went; `local` is a cluster like any other and does belong in the visit history. */
function isRecordableCluster(id: string): boolean {
  return !!id && id !== BLANK_CLUSTER;
}

// RECENT mutation for a visit: prepend `id` most-recent-first (de-duped), then strip the empty ids and
// the `_` placeholder an older build may have persisted. `local` is a cluster the user visits like any
// other, so it stays.
export const prependRecent = (id: string): Mutation => ({
  key:   RECENT_CLUSTERS,
  apply: (recents) => {
    const current = Array.isArray(recents) ? recents : [];

    return [id, ...current.filter((r) => r !== id)]
      .filter((c) => isRecordableCluster(c))
      .slice(0, RECENT_CLUSTERS_FETCHED);
  },
});

// PINNED mutation for a drag-reorder: the shelf's rows in their new order. Written as a MERGE rather
// than a wholesale replace because `commitAndReconcile` re-runs this against what the server holds when
// the write goes out — a plain overwrite would resurrect a cluster unpinned in another tab, and lose one
// pinned there.
//
// `orderedIds` is only what the shelf can show, so the rest of the pref has to be carried across: the
// shelf never lists `local` (it has its own fixed slot) and never lists a cluster whose data has not
// loaded, and neither has a position in the drag to claim.
export const reorderPinned = (orderedIds: string[]): Mutation => ({
  key:   PINNED_CLUSTERS,
  apply: (pinned) => {
    const current = Array.isArray(pinned) ? pinned : [];
    const dragged = new Set(orderedIds);

    return [
      // The order the user dropped them in, minus anything unpinned elsewhere while they dragged.
      ...orderedIds.filter((id) => current.includes(id)),
      // Everything the shelf never showed, kept in its existing relative order.
      ...current.filter((id) => !dragged.has(id)),
    ];
  },
});

// The i18n `t` of whichever surface is reporting; only the pin-error key is looked up here. Declared
// locally (like `Dispatch`) so this writer stays free of component/composable imports.
type Translate = (key: string, args?: unknown, raw?: boolean) => string;
// Just the slice of the Vuex store this needs. Taken as the store rather than a bare `dispatch` so the
// lookup stays INSIDE the failure branch: the callers mount without a store in their unit tests, where
// dereferencing `useStore()` up front would throw on every toggle.
type Growler = { dispatch: Dispatch };

/**
 * Report a failed pin/unpin write. The write REPORTS failure by RESOLVING with `{ type, status }` — and by
 * then the optimistic commit has already put the new state on screen, where it would sit wrong until a
 * reload silently reverted it. Lives here, beside the contract it reads, so the nav shelf and the switcher
 * flyout can never drift apart on how a failed pin is surfaced.
 */
export function reportPinWriteFailure(store: Growler, t: Translate, write: Promise<any> | any): Promise<void> {
  return Promise.resolve(write)
    .then((result: any) => {
      if (result?.status) {
        // The writer reports failure with a bare `{ type, status }`, which `stringify` would dump as raw
        // JSON into the growl body — give it a message to show instead.
        store.dispatch('growl/fromError', {
          title: t('nav.pinClusterError'),
          err:   { ...result, message: t('nav.pinClusterError') },
        });
      }
    })
    // Nothing in the write rejects by contract; this is only so an unexpected throw isn't swallowed.
    .catch((e) => console.warn('Unable to toggle the cluster pin', e)); // eslint-disable-line no-console
}

/**
 * Commit the optimistic client change immediately (outside the queue) so the shelf and its row
 * animation start the instant the user clicks, then serialize only the server round-trip so the UI
 * never waits behind it.
 */
export function commitAndReconcile(dispatch: Dispatch, mutations: Mutation[]): Promise<any> {
  // `applyPrefsOptimistic` is a SYNC Vuex action, so the client commit lands in this tick; both phases
  // REPORT failure the same way (resolving with `{ type, status }`), so one resolved-value check covers
  // the whole write. A failed optimistic phase committed nothing, so there is nothing to reconcile.
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
