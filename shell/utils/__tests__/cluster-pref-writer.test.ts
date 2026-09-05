import { prependRecent, recordClusterNavigation } from '@shell/utils/cluster-pref-writer';
import { CLUSTER, MENU_MAX_RECENT_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';

// The prefs under test are heterogeneous: RECENT/PINNED are string[], CLUSTER is a string.
type PrefValue = string | string[];

describe('fx: cluster-pref-writer', () => {
  describe('prependRecent', () => {
    it('prepends most-recent-first and de-dupes', () => {
      expect(prependRecent('c-a').apply(['c-b', 'c-a'])).toStrictEqual(['c-a', 'c-b']);
    });

    it('strips empty and placeholder (local / blank) entries', () => {
      expect(prependRecent('c-a').apply(['local', '_', '', 'c-z'])).toStrictEqual(['c-a', 'c-z']);
    });

    it('does not mutate the input list', () => {
      const input = ['c-b', 'c-a'];

      prependRecent('c-a').apply(input);

      expect(input).toStrictEqual(['c-b', 'c-a']);
    });

    it('tolerates a non-array value', () => {
      expect(prependRecent('c-a').apply(undefined as any)).toStrictEqual(['c-a']);
    });

    // Only the first MENU_MAX_RECENT_CLUSTERS are ever displayed, so an uncapped log is dead weight
    // re-serialized into the shared per-user Preference on every pin, unpin and cluster visit.
    it('caps the stored log so a long tour of the estate cannot grow it without bound', () => {
      let value: string[] = [];

      for (let i = 0; i < 300; i++) {
        value = prependRecent(`c-${ i }`).apply(value) as string[];
      }

      expect(value).toHaveLength(MENU_MAX_RECENT_CLUSTERS * 2);
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

    it('remembers local / blank as the current cluster but never lists them under RECENT', async() => {
      const s = makeStore({ [CLUSTER]: '', [RECENT_CLUSTERS]: ['c-b'] });

      await recordClusterNavigation(s.dispatch, 'local');

      expect(s.writes).toStrictEqual([{ key: CLUSTER, value: 'local' }]); // CLUSTER only — no RECENT mutation
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
      expect(recent.apply(['local', 'c-a', 'c-z'])).toStrictEqual(['c-a', 'c-z']);
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
