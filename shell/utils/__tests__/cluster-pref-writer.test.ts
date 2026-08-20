import { enqueue, recordClusterVisit, pinCluster, unpinCluster } from '@shell/utils/cluster-pref-writer';
import { PINNED_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';

describe('fx: cluster-pref-writer', () => {
  describe('enqueue', () => {
    it('runs tasks strictly sequentially (never in parallel)', async() => {
      const order: string[] = [];
      const task = (name: string, delay: number) => () => new Promise<void>((resolve) => {
        order.push(`${ name }:start`);
        setTimeout(() => {
          order.push(`${ name }:end`);
          resolve();
        }, delay);
      });

      // Enqueue B with a longer delay first, then A — B must fully finish before A starts.
      const p1 = enqueue(task('B', 20));
      const p2 = enqueue(task('A', 1));

      await Promise.all([p1, p2]);

      expect(order).toStrictEqual(['B:start', 'B:end', 'A:start', 'A:end']);
    });

    it('keeps running later tasks even if an earlier one rejects', async() => {
      const ran: string[] = [];

      const p1 = enqueue(() => Promise.reject(new Error('boom'))).catch(() => {});
      const p2 = enqueue(() => {
        ran.push('after');

        return Promise.resolve();
      });

      await Promise.all([p1, p2]);
      expect(ran).toStrictEqual(['after']);
    });
  });

  // Mock store modelling the split write: `applyPrefsOptimistic` mutates the CLIENT immediately (and returns
  // the values it wrote); `reconcilePrefs` runs the transforms against the SERVER and writes only changed
  // keys. Client === server initially for these unit tests (the client-vs-server drift lives in the prefs
  // store's reconcile tests). `data` exposes the client. dispatch simulates both prefs actions.
  const makeStore = (initial: Record<string, string[]>) => {
    const clientData: Record<string, string[]> = { ...initial };
    const serverData: Record<string, string[]> = { ...initial };
    const getters = { 'prefs/get': (key: string) => clientData[key] };
    const writes: Array<{ key: string, value: string[] }> = [];
    const calls: Array<{ action: string, payload: any }> = [];
    const dispatch = (action: string, payload: any) => {
      calls.push({ action, payload });

      if (action === 'prefs/applyPrefsOptimistic') {
        const optimistic: Record<string, string[]> = {};

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

  describe('recordClusterVisit', () => {
    it('prepends the cluster to RECENT — optimistic first, then the serialized reconcile', async() => {
      const s = makeStore({ [RECENT_CLUSTERS]: ['c-b'] });

      await recordClusterVisit(s.getters, s.dispatch, 'c-a');

      // Two dispatches: the immediate optimistic commit, then the reconcile that persists.
      expect(s.calls.map((c) => c.action)).toStrictEqual(['prefs/applyPrefsOptimistic', 'prefs/reconcilePrefs']);
      expect(s.writes).toStrictEqual([{ key: RECENT_CLUSTERS, value: ['c-a', 'c-b'] }]);
    });

    it('is idempotent: a duplicate visit resolves to a no-op (no second write)', async() => {
      const s = makeStore({ [RECENT_CLUSTERS]: ['c-b'] });

      // Two visits to the same cluster fired "at once" — the second must be a no-op, not a racing PUT.
      await Promise.all([
        recordClusterVisit(s.getters, s.dispatch, 'c-a'),
        recordClusterVisit(s.getters, s.dispatch, 'c-a'),
      ]);

      expect(s.writes).toHaveLength(1);
      expect(s.data[RECENT_CLUSTERS]).toStrictEqual(['c-a', 'c-b']);
    });

    it('is a no-op for a missing / non-recordable id', async() => {
      const s = makeStore({ [RECENT_CLUSTERS]: ['c-b'] });

      await recordClusterVisit(s.getters, s.dispatch, '');
      await recordClusterVisit(s.getters, s.dispatch, 'local');

      expect(s.calls).toHaveLength(0);
    });

    it('sends a TRANSFORM so the prepend applies to whatever value is live (server on reload)', async() => {
      // The writer sends a transform, not a precomputed value — so setMerge can run it against the
      // SERVER's real recent (not a cold cache), which is what stops a reload clobbering the list.
      const s = makeStore({ [RECENT_CLUSTERS]: ['c-b'] });

      await recordClusterVisit(s.getters, s.dispatch, 'c-a');

      const { apply } = s.calls[0].payload[0];

      // Applied to a DIFFERENT (server) list, it still just prepends + strips placeholders.
      expect(apply(['c-x', 'c-y'])).toStrictEqual(['c-a', 'c-x', 'c-y']);
      expect(apply(['local', 'c-a', 'c-z'])).toStrictEqual(['c-a', 'c-z']);
    });
  });

  describe('pin / unpin', () => {
    it('pin adds to PINNED only, leaving RECENT untouched', async() => {
      const s = makeStore({ [PINNED_CLUSTERS]: [], [RECENT_CLUSTERS]: ['c-a'] });

      await pinCluster(s.getters, s.dispatch, 'c-a');

      expect(s.calls[0].action).toBe('prefs/applyPrefsOptimistic');
      expect(s.writes).toStrictEqual([{ key: PINNED_CLUSTERS, value: ['c-a'] }]);
      expect(s.data[RECENT_CLUSTERS]).toStrictEqual(['c-a']); // still recent
    });

    it('pin is idempotent for an already-pinned cluster (no write)', async() => {
      const s = makeStore({ [PINNED_CLUSTERS]: ['c-a'] });

      await pinCluster(s.getters, s.dispatch, 'c-a');

      expect(s.writes).toHaveLength(0);
    });

    it('unpin removes from PINNED and promotes to the front of RECENT in ONE write', async() => {
      const s = makeStore({ [PINNED_CLUSTERS]: ['c-a', 'c-b'], [RECENT_CLUSTERS]: ['c-c'] });

      await unpinCluster(s.getters, s.dispatch, 'c-a');

      // Both keys travel together through the one optimistic + one reconcile pair.
      expect(s.calls.map((c) => c.action)).toStrictEqual(['prefs/applyPrefsOptimistic', 'prefs/reconcilePrefs']);
      expect(s.calls[0].payload.map((m: any) => m.key)).toStrictEqual([PINNED_CLUSTERS, RECENT_CLUSTERS]);
      expect(s.data[PINNED_CLUSTERS]).toStrictEqual(['c-b']);
      expect(s.data[RECENT_CLUSTERS]).toStrictEqual(['c-a', 'c-c']);
    });

    it('unpin does not touch RECENT for local (only the PINNED mutation is sent)', async() => {
      const s = makeStore({ [PINNED_CLUSTERS]: ['local', 'c-b'] });

      await unpinCluster(s.getters, s.dispatch, 'local');

      expect(s.calls[0].payload.map((m: any) => m.key)).toStrictEqual([PINNED_CLUSTERS]);
      expect(s.data[PINNED_CLUSTERS]).toStrictEqual(['c-b']);
    });

    it('unpin of a not-pinned cluster leaves PINNED unchanged but still promotes it to RECENT', async() => {
      const s = makeStore({ [PINNED_CLUSTERS]: ['c-b'], [RECENT_CLUSTERS]: ['c-c'] });

      await unpinCluster(s.getters, s.dispatch, 'c-a');

      // Both mutations are sent, but the PINNED transform is a no-op (c-a wasn't pinned) so only RECENT
      // is actually written.
      expect(s.calls[0].payload.map((m: any) => m.key)).toStrictEqual([PINNED_CLUSTERS, RECENT_CLUSTERS]);
      expect(s.writes.map((w) => w.key)).toStrictEqual([RECENT_CLUSTERS]);
      expect(s.data[PINNED_CLUSTERS]).toStrictEqual(['c-b']);
      expect(s.data[RECENT_CLUSTERS]).toStrictEqual(['c-a', 'c-c']);
    });
  });
});
