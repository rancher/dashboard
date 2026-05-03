import type defaultGc from '@shell/utils/gc/gc';
import { MANAGEMENT } from '@shell/config/types';

type GcInstance = typeof defaultGc;

const DEFAULT_PREFS = {
  enabled:           true,
  enabledInterval:   true,
  interval:          300,
  enabledOnNavigate: true,
  ageThreshold:      120, // seconds → maxAge = 120_000 ms
  countThreshold:    500,
};

let stampCounter = 1000;

function makeRootState(prefs = DEFAULT_PREFS, clusterReady = true): any {
  stampCounter++;

  return {
    clusterReady,
    management: {
      types: {
        [MANAGEMENT.SETTING]: {
          list: [
            {
              id:       'ui-performance',
              value:    JSON.stringify({ garbageCollection: prefs }),
              metadata: { generation: stampCounter, resourceVersion: '1' },
            },
          ],
        },
      },
    },
  };
}

function makeEmptyRootState(): any {
  return {
    clusterReady: true,
    management:   { types: { [MANAGEMENT.SETTING]: { list: [] } } },
  };
}

function makeCtx(options: {
  namespace?: string;
  supportsGc?: boolean;
  gcIgnoreTypes?: Record<string, boolean>;
  prefs?: Partial<typeof DEFAULT_PREFS>;
  dispatch?: jest.Mock;
  countsByType?: Record<string, number>;
  clusterReady?: boolean;
} = {}): any {
  const {
    namespace = 'teststore',
    supportsGc = true,
    gcIgnoreTypes = {},
    prefs,
    dispatch = jest.fn(),
    countsByType = {},
    clusterReady = true,
  } = options;

  const rootState = makeRootState(
    prefs ? { ...DEFAULT_PREFS, ...prefs } : DEFAULT_PREFS,
    clusterReady
  );

  return {
    state:   { config: { supportsGc, namespace } },
    rootState,
    getters: {
      gcIgnoreTypes,
      all: () => [{
        counts: Object.fromEntries(
          Object.entries(countsByType).map(([t, c]) => [t, { summary: { count: c } }])
        ),
      }],
    },
    dispatch,
  };
}

/**
 * Each test in the outer describe gets a fresh gc instance (gcLastRun = 0,
 * empty caches) so tests do not interfere with each other via shared singleton state.
 */
describe('gc', () => {
  let gc: GcInstance;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    gc = require('@shell/utils/gc/gc').default as GcInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── gcEnabledForStore ─────────────────────────────────────────────────────

  describe('gcEnabledForStore', () => {
    it('returns true when state.config.supportsGc is true', () => {
      expect(gc.gcEnabledForStore({ config: { supportsGc: true } })).toBe(true);
    });

    it('returns false when state.config.supportsGc is false', () => {
      expect(gc.gcEnabledForStore({ config: { supportsGc: false } })).toBe(false);
    });

    it('returns undefined when state is undefined', () => {
      expect(gc.gcEnabledForStore(undefined)).toBeUndefined();
    });
  });

  // ─── gcEnabledForType ──────────────────────────────────────────────────────

  describe('gcEnabledForType', () => {
    it('returns false when type is empty string', () => {
      const ctx = { getters: { gcIgnoreTypes: {} } };

      expect(gc.gcEnabledForType(ctx, '')).toBe(false);
    });

    it('returns false when type is present in gcIgnoreTypes', () => {
      const ctx = { getters: { gcIgnoreTypes: { pods: true } } };

      expect(gc.gcEnabledForType(ctx, 'pods')).toBe(false);
    });

    it('returns true when type is non-empty and not in gcIgnoreTypes', () => {
      const ctx = { getters: { gcIgnoreTypes: {} } };

      expect(gc.gcEnabledForType(ctx, 'deployments')).toBe(true);
    });
  });

  // ─── gcEnabledSetting ──────────────────────────────────────────────────────

  describe('gcEnabledSetting', () => {
    it('returns true when GC is enabled in ui-performance setting', () => {
      const ctx = { rootState: makeRootState({ ...DEFAULT_PREFS, enabled: true }) };

      expect(gc.gcEnabledSetting(ctx)).toBe(true);
    });

    it('returns false when GC is disabled in ui-performance setting', () => {
      const ctx = { rootState: makeRootState({ ...DEFAULT_PREFS, enabled: false }) };

      expect(gc.gcEnabledSetting(ctx)).toBe(false);
    });

    it('returns undefined when ui-performance setting is absent', () => {
      const ctx = { rootState: makeEmptyRootState() };

      expect(gc.gcEnabledSetting(ctx)).toBeUndefined();
    });
  });

  // ─── gcEnabledAll ──────────────────────────────────────────────────────────

  describe('gcEnabledAll', () => {
    it('returns true when store, setting, and type checks all pass', () => {
      expect(gc.gcEnabledAll(makeCtx(), 'deployments')).toBe(true);
    });

    it('returns false when store does not support GC', () => {
      expect(gc.gcEnabledAll(makeCtx({ supportsGc: false }), 'deployments')).toBe(false);
    });

    it('returns false when GC is disabled in settings', () => {
      expect(gc.gcEnabledAll(makeCtx({ prefs: { enabled: false } }), 'deployments')).toBe(false);
    });

    it('returns false when type is in gcIgnoreTypes', () => {
      expect(gc.gcEnabledAll(makeCtx({ gcIgnoreTypes: { schema: true } }), 'schema')).toBe(false);
    });
  });

  // ─── gcEnabledInterval ─────────────────────────────────────────────────────

  describe('gcEnabledInterval', () => {
    it('returns enabledInterval and interval from settings', () => {
      const ctx = {
        rootState: makeRootState({
          ...DEFAULT_PREFS, enabledInterval: true, interval: 600
        })
      };

      expect(gc.gcEnabledInterval(ctx)).toStrictEqual({ enabled: true, interval: 600 });
    });

    it('returns enabled: undefined and interval: 0 when setting is absent', () => {
      const ctx = { rootState: makeEmptyRootState() };

      expect(gc.gcEnabledInterval(ctx)).toStrictEqual({ enabled: undefined, interval: 0 });
    });

    it('returns interval: 0 when the interval value is falsy', () => {
      const ctx = { rootState: makeRootState({ ...DEFAULT_PREFS, interval: 0 }) };

      expect(gc.gcEnabledInterval(ctx)).toStrictEqual({ enabled: true, interval: 0 });
    });
  });

  // ─── gcEnabledRoute ────────────────────────────────────────────────────────

  describe('gcEnabledRoute', () => {
    it('returns enabledOnNavigate from settings', () => {
      const ctx = { rootState: makeRootState({ ...DEFAULT_PREFS, enabledOnNavigate: false }) };

      expect(gc.gcEnabledRoute(ctx)).toBe(false);
    });

    it('returns undefined when setting is absent', () => {
      const ctx = { rootState: makeEmptyRootState() };

      expect(gc.gcEnabledRoute(ctx)).toBeUndefined();
    });
  });

  // ─── gcUpdateRouteChanged ──────────────────────────────────────────────────

  describe('gcUpdateRouteChanged', () => {
    /**
     * Condition in garbageCollect:
     *   if (lastRouteChange < lastAccessed) → skip (resource is in current route)
     *
     * So: route changed at T1, resource accessed at T2 > T1
     *   → lastRouteChange (T1) < lastAccessed (T2) → GC skips this type.
     */
    it('prevents a resource from being GC\'d when route changed before last access', () => {
      const dispatch = jest.fn();
      const type = 'pods';
      const namespace = 'routetest';

      jest.useFakeTimers();

      // Route change at t=200_000 ms
      jest.setSystemTime(200_000);
      gc.gcUpdateRouteChanged();

      // Resource accessed at t=300_000 ms (AFTER route change → in current route)
      jest.setSystemTime(300_000);
      gc.gcUpdateLastAccessed(makeCtx({ namespace }), type);

      // GC runs at t=600_000 ms
      // now - lastAccessed = 300_000 > maxAge(120_000) ✓ age check passes
      // lastRouteChange(200_000) < lastAccessed(300_000) → skip (in current route)
      jest.setSystemTime(600_000);
      gc.garbageCollect(makeCtx({
        namespace,
        countsByType: { [type]: 1000 },
        dispatch,
      }));

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', type);
    });
  });

  // ─── garbageCollect ────────────────────────────────────────────────────────

  describe('garbageCollect', () => {
    it('skips when recently run (within GC_RE_RUN_GAP of 5 s)', () => {
      const dispatch = jest.fn();

      jest.useFakeTimers();
      jest.setSystemTime(10_000);

      // First call: cluster not ready → gcLastRun = 10_000
      gc.garbageCollect(makeCtx({ clusterReady: false, dispatch }));
      // Second call at same time: 10_000 - 10_000 = 0 < 5000 → skips
      gc.garbageCollect(makeCtx({ dispatch }));

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', expect.any(String));
    });

    it('skips when cluster is not ready', () => {
      const dispatch = jest.fn();

      jest.useFakeTimers();
      jest.setSystemTime(10_000);

      gc.garbageCollect(makeCtx({ clusterReady: false, dispatch }));

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', expect.any(String));
    });

    it('skips when ui-performance setting is absent', () => {
      const dispatch = jest.fn();

      jest.useFakeTimers();
      jest.setSystemTime(10_000);

      const ctx = {
        state:     { config: { supportsGc: true, namespace: 'teststore' } },
        rootState: makeEmptyRootState(),
        getters:   { gcIgnoreTypes: {} },
        dispatch,
      };

      gc.garbageCollect(ctx);

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', expect.any(String));
    });

    it('skips a type listed in the explicit ignoreTypes parameter', () => {
      const dispatch = jest.fn();
      const type = 'configmaps';
      const namespace = 'ignoretypetest';

      jest.useFakeTimers();

      jest.setSystemTime(200_000);
      gc.gcUpdateLastAccessed(makeCtx({ namespace }), type);

      jest.setSystemTime(300_000);
      gc.gcUpdateRouteChanged();

      jest.setSystemTime(400_000);
      gc.garbageCollect(
        makeCtx({
          namespace, countsByType: { [type]: 1000 }, dispatch
        }),
        { [type]: true }
      );

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', type);
    });

    it('skips a type that was accessed within the ageThreshold', () => {
      const dispatch = jest.fn();
      const type = 'secrets';
      const namespace = 'recenttest';

      jest.useFakeTimers();

      // Access 30 s ago (less than 120 s ageThreshold)
      jest.setSystemTime(10_000);
      gc.gcUpdateLastAccessed(makeCtx({ namespace }), type);

      jest.setSystemTime(40_000); // 30 s later
      gc.garbageCollect(makeCtx({
        namespace, countsByType: { [type]: 1000 }, dispatch
      }));

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', type);
    });

    it('skips a type whose count is below countThreshold', () => {
      const dispatch = jest.fn();
      const type = 'namespaces';
      const namespace = 'lowcounttest';

      jest.useFakeTimers();

      jest.setSystemTime(200_000);
      gc.gcUpdateLastAccessed(makeCtx({ namespace }), type);

      jest.setSystemTime(300_000);
      gc.gcUpdateRouteChanged();

      jest.setSystemTime(400_000);
      // count(100) < countThreshold(500) → skip
      gc.garbageCollect(makeCtx({
        namespace, countsByType: { [type]: 100 }, dispatch
      }));

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', type);
    });

    it('dispatches forgetType for a resource that meets all GC criteria', () => {
      const dispatch = jest.fn();
      const type = 'events';
      const namespace = 'gcqualifytest';

      jest.useFakeTimers();

      // Resource accessed at t=200_000
      jest.setSystemTime(200_000);
      gc.gcUpdateLastAccessed(makeCtx({ namespace }), type);

      // Route changed at t=300_000 (AFTER access → lastRouteChange > lastAccessed → no skip)
      jest.setSystemTime(300_000);
      gc.gcUpdateRouteChanged();

      // GC at t=400_000: now - lastAccessed = 200_000 > maxAge(120_000) ✓
      jest.setSystemTime(400_000);
      gc.garbageCollect(makeCtx({
        namespace, countsByType: { [type]: 1000 }, dispatch
      }));

      expect(dispatch).toHaveBeenCalledWith('forgetType', type);
    });
  });

  // ─── gcResetStore ──────────────────────────────────────────────────────────

  describe('gcResetStore', () => {
    it('removes all cached entries for the store, preventing forgetType dispatch', () => {
      const dispatch = jest.fn();
      const type = 'ingresses';
      const namespace = 'resetstoretest';

      jest.useFakeTimers();

      jest.setSystemTime(200_000);
      gc.gcUpdateLastAccessed(makeCtx({ namespace }), type);

      jest.setSystemTime(300_000);
      gc.gcUpdateRouteChanged();

      gc.gcResetStore({ config: { namespace } });

      jest.setSystemTime(400_000);
      gc.garbageCollect(makeCtx({
        namespace, countsByType: { [type]: 1000 }, dispatch
      }));

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', type);
    });
  });

  // ─── gcResetType ───────────────────────────────────────────────────────────

  describe('gcResetType', () => {
    it('removes a specific type so it is not GC\'d while leaving other types intact', () => {
      const dispatch = jest.fn();
      const typeA = 'storageclasses';
      const typeB = 'persistentvolumes';
      const namespace = 'resettypetest';

      jest.useFakeTimers();

      jest.setSystemTime(200_000);
      gc.gcUpdateLastAccessed(makeCtx({ namespace }), typeA);
      gc.gcUpdateLastAccessed(makeCtx({ namespace }), typeB);

      jest.setSystemTime(300_000);
      gc.gcUpdateRouteChanged();

      gc.gcResetType({ config: { namespace } }, typeA);

      jest.setSystemTime(400_000);
      gc.garbageCollect(makeCtx({
        namespace,
        countsByType: { [typeA]: 1000, [typeB]: 1000 },
        dispatch,
      }));

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', typeA);
      expect(dispatch).toHaveBeenCalledWith('forgetType', typeB);
    });

    it('is a no-op when the store has no cached entries', () => {
      expect(() => {
        gc.gcResetType({ config: { namespace: 'nonexistent-store' } }, 'pods');
      }).not.toThrow();
    });
  });

  // ─── gcUpdateLastAccessed ──────────────────────────────────────────────────

  describe('gcUpdateLastAccessed', () => {
    it('does not populate cache when GC is disabled for the store', () => {
      const dispatch = jest.fn();
      const type = 'replicasets';
      const namespace = 'disabledgctest';

      jest.useFakeTimers();

      // supportsGc: false → gcEnabledAll = false → cache not updated
      jest.setSystemTime(200_000);
      gc.gcUpdateLastAccessed(makeCtx({ namespace, supportsGc: false }), type);

      jest.setSystemTime(300_000);
      gc.gcUpdateRouteChanged();

      jest.setSystemTime(400_000);
      gc.garbageCollect(makeCtx({
        namespace, countsByType: { [type]: 1000 }, dispatch
      }));

      expect(dispatch).not.toHaveBeenCalledWith('forgetType', type);
    });
  });
});
