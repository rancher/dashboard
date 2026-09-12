import { prependRecent, recordClusterNavigation, reorderPinned } from '@shell/utils/cluster-pref-writer';
import { CLUSTER, PINNED_CLUSTERS, RECENT_CLUSTERS, RECENT_CLUSTERS_FETCHED } from '@shell/store/prefs';
import { BLANK_CLUSTER } from '@shell/store/store-types';

// The prefs under test are heterogeneous: RECENT/PINNED are string[], CLUSTER is a string.
type PrefValue = string | string[];

describe('fx: cluster-pref-writer', () => {
  describe('prependRecent', () => {
    it('prepends most-recent-first and de-dupes', () => {
      expect(prependRecent('c-a').apply(['c-b', 'c-a'])).toStrictEqual(['c-a', 'c-b']);
    });

    // `_` is a placeholder for "no cluster", not somewhere the user went. `local` is a real cluster and
    // stays in the log like any other.
    it('strips empty and blank placeholder entries, keeping local', () => {
      expect(prependRecent('c-a').apply(['local', '_', '', 'c-z'])).toStrictEqual(['c-a', 'local', 'c-z']);
    });

    it('does not mutate the input list', () => {
      const input = ['c-b', 'c-a'];

      prependRecent('c-a').apply(input);

      expect(input).toStrictEqual(['c-b', 'c-a']);
    });

    it('tolerates a non-array value', () => {
      expect(prependRecent('c-a').apply(undefined as any)).toStrictEqual(['c-a']);
    });

    // The log is stored at what the flyout ASKS FOR, which is more than it shows: the fetch is by id and an
    // id can stop resolving, so the extra cover the ones that come back empty. Past that the log is dead
    // weight re-serialized into the shared per-user Preference on every pin, unpin and cluster visit.
    it('caps the stored log so a long tour of the estate cannot grow it without bound', () => {
      let value: string[] = [];

      for (let i = 0; i < 300; i++) {
        value = prependRecent(`c-${ i }`).apply(value) as string[];
      }

      expect(value).toHaveLength(RECENT_CLUSTERS_FETCHED);
      // Most-recent-first is preserved — it is the tail that is dropped.
      expect(value[0]).toBe('c-299');
    });
  });

  // Mock store modelling the split write: `applyPrefsOptimistic` mutates the client immediately;
  // `reconcilePrefs` runs the transforms against the server and writes only changed keys (here client === server).
  const makeStore = (initial: Record<string, PrefValue>) => {
    const clientData: Record<string, PrefValue> = { ...initial };
    const serverData: Record<string, PrefValue> = { ...initial };
    const getters = { 'prefs/get': (key: string) => clientData[key] };
    const writes: Array<{ key: string, value: PrefValue }> = [];
    const calls: Array<{ action: string, payload: any }> = [];
    const dispatch = (action: string, payload: any) => {
      calls.push({ action, payload });

      if (action === 'prefs/applyPrefsOptimistic') {
        const optimistic: Record<string, PrefValue> = {};

        for (const { key, apply } of payload) {
          const next = apply(clientData[key]);

          optimistic[key] = next;
          clientData[key] = next;
        }

        return Promise.resolve(optimistic);
      }

      if (action === 'prefs/reconcilePrefs') {
        const { mutations, optimistic } = payload;

        for (const { key, apply } of mutations) {
          const base = serverData[key];
          const reconciled = apply(base);

          // Adopt the server-based result on drift (here client === server, so this is a no-op).
          if (JSON.stringify(reconciled) !== JSON.stringify(optimistic?.[key])) {
            clientData[key] = reconciled;
          }
          // Persist only the keys the transform actually changed.
          if (JSON.stringify(reconciled) !== JSON.stringify(base)) {
            serverData[key] = reconciled;
            writes.push({ key, value: reconciled });
          }
        }

        return Promise.resolve();
      }

      return Promise.resolve();
    };

    return {
      getters, dispatch, writes, calls, data: clientData
    };
  };

  describe('reorderPinned', () => {
    it('writes the dragged order to the pinned pref', () => {
      const { key, apply } = reorderPinned(['c', 'a', 'b']);

      expect(key).toBe(PINNED_CLUSTERS);
      expect(apply(['a', 'b', 'c'])).toStrictEqual(['c', 'a', 'b']);
    });

    // `commitAndReconcile` re-runs this against the server's live value, so the transform meets a pref
    // that may have moved on. A plain overwrite would undo whatever moved it.
    it('keeps a cluster pinned elsewhere while the drag was in flight', () => {
      const { apply } = reorderPinned(['c', 'a']);

      // 'z' was pinned in another tab and was never on screen to be dragged, so it has no place in the
      // dropped order to claim — it keeps its pin, at the end.
      expect(apply(['a', 'c', 'z'])).toStrictEqual(['c', 'a', 'z']);
    });

    it('does not resurrect a cluster unpinned elsewhere while the drag was in flight', () => {
      const { apply } = reorderPinned(['c', 'a', 'b']);

      expect(apply(['a', 'c'])).toStrictEqual(['c', 'a']);
    });

    // The shelf never lists `local` — it has its own fixed slot above — so a reorder must carry it across
    // rather than read its absence from the dragged ids as an unpin.
    it('keeps a pinned cluster the shelf never showed', () => {
      const { apply } = reorderPinned(['b', 'a']);

      expect(apply(['local', 'a', 'b'])).toStrictEqual(['b', 'a', 'local']);
    });

    it.each([
      ['undefined', undefined],
      ['a non-array', 'nonsense'],
    ])('survives a pref stored as %s', (_label, stored) => {
      const { apply } = reorderPinned(['a']);

      expect(apply(stored as any)).toStrictEqual([]);
    });
  });

  describe('recordClusterNavigation', () => {
    it('remembers the current cluster AND prepends it to RECENT — in ONE write', async() => {
      const s = makeStore({ [CLUSTER]: '', [RECENT_CLUSTERS]: ['c-b'] });

      await recordClusterNavigation(s.dispatch, 'c-a');

      // Two dispatches: the immediate optimistic commit, then the reconcile that persists BOTH keys at once.
      expect(s.calls.map((c) => c.action)).toStrictEqual(['prefs/applyPrefsOptimistic', 'prefs/reconcilePrefs']);
      expect(s.writes).toStrictEqual([
        { key: CLUSTER, value: 'c-a' },
        { key: RECENT_CLUSTERS, value: ['c-a', 'c-b'] },
      ]);
    });

    it('is idempotent: a duplicate navigation resolves to a no-op (no second, racing write)', async() => {
      const s = makeStore({ [CLUSTER]: '', [RECENT_CLUSTERS]: ['c-b'] });

      await Promise.all([
        recordClusterNavigation(s.dispatch, 'c-a'),
        recordClusterNavigation(s.dispatch, 'c-a'),
      ]);

      // Only the first navigation writes (CLUSTER + RECENT); the second sees no change and writes nothing.
      expect(s.writes).toStrictEqual([
        { key: CLUSTER, value: 'c-a' },
        { key: RECENT_CLUSTERS, value: ['c-a', 'c-b'] },
      ]);
      expect(s.data[RECENT_CLUSTERS]).toStrictEqual(['c-a', 'c-b']);
    });

    it('records a visit to local under RECENT, like any other cluster', async() => {
      const s = makeStore({ [CLUSTER]: '', [RECENT_CLUSTERS]: ['c-b'] });

      await recordClusterNavigation(s.dispatch, 'local');

      expect(s.data[CLUSTER]).toStrictEqual('local');
      expect(s.data[RECENT_CLUSTERS]).toStrictEqual(['local', 'c-b']);
    });

    it('remembers the blank placeholder as the current cluster but never lists it under RECENT', async() => {
      const s = makeStore({ [CLUSTER]: '', [RECENT_CLUSTERS]: ['c-b'] });

      await recordClusterNavigation(s.dispatch, BLANK_CLUSTER);

      expect(s.writes).toStrictEqual([{ key: CLUSTER, value: BLANK_CLUSTER }]); // CLUSTER only — no RECENT mutation
      expect(s.data[RECENT_CLUSTERS]).toStrictEqual(['c-b']); // unchanged
    });

    it('sends a TRANSFORM for RECENT so the prepend applies to whatever value is live (server on reload)', async() => {
      // The writer sends a transform, not a precomputed value — so the reconcile can run it against the
      // SERVER's real recent (not a cold cache), which is what stops a reload clobbering the list.
      const s = makeStore({ [CLUSTER]: '', [RECENT_CLUSTERS]: ['c-b'] });

      await recordClusterNavigation(s.dispatch, 'c-a');

      const recent = s.calls[0].payload.find((m: any) => m.key === RECENT_CLUSTERS);

      // Applied to a DIFFERENT (server) list, it still just prepends + strips placeholders.
      expect(recent.apply(['c-x', 'c-y'])).toStrictEqual(['c-a', 'c-x', 'c-y']);
      expect(recent.apply(['_', 'c-a', 'c-z'])).toStrictEqual(['c-a', 'c-z']);
    });

    it('a failed optimistic phase is reported to the caller and skips the server round-trip', async() => {
      const seen: string[] = [];
      // Phase 1 REPORTS failure by resolving with `{ type, status }` (it commits nothing when it does),
      // exactly like phase 2 — so the caller has one check, and there is nothing to reconcile.
      const dispatch = (action: string) => {
        seen.push(action);

        return Promise.resolve(action === 'prefs/applyPrefsOptimistic' ? { type: 'error', status: 400 } : undefined);
      };

      const result = await recordClusterNavigation(dispatch, 'c-a');

      expect(result).toStrictEqual({ type: 'error', status: 400 });
      expect(seen).toStrictEqual(['prefs/applyPrefsOptimistic']);
    });

    it('a failed write does not wedge later navigations — the serialized queue keeps draining, in order', async() => {
      let reconciles = 0;
      const seen: string[] = [];
      const dispatch = (action: string, payload: any) => {
        if (action === 'prefs/applyPrefsOptimistic') {
          return Promise.resolve({});
        }

        if (action === 'prefs/reconcilePrefs') {
          reconciles++;
          seen.push(payload.mutations[0].apply('') as string); // the CLUSTER value for this navigation

          // The first server round-trip rejects; the queue must still run the second.
          return reconciles === 1 ? Promise.reject(new Error('boom')) : Promise.resolve();
        }

        return Promise.resolve();
      };

      await Promise.all([
        recordClusterNavigation(dispatch, 'c-a').catch(() => {}),
        recordClusterNavigation(dispatch, 'c-b'),
      ]);

      expect(seen).toStrictEqual(['c-a', 'c-b']); // both ran, in order, despite the first failing
    });
  });
});
