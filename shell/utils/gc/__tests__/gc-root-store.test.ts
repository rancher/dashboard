import type { gcGetters as GcGettersType, gcActions as GcActionsType } from '@shell/utils/gc/gc-root-store';

let gcGetters: typeof GcGettersType;
let gcActions: typeof GcActionsType;
let mockGc: any;
let mockGcInterval: any;
let mockGcRoute: any;

describe('gc-root-store', () => {
  beforeEach(() => {
    mockGc = {
      gcEnabledForStore: jest.fn(),
      gcEnabledSetting:  jest.fn(),
    };

    mockGcInterval = {
      gcStartIntervals: jest.fn(),
      gcStopIntervals:  jest.fn(),
    };

    mockGcRoute = { gcRouteChanged: jest.fn() };

    jest.resetModules();
    jest.mock('../gc', () => ({ default: mockGc, __esModule: true }));
    jest.mock('../gc-interval', () => ({ default: mockGcInterval, __esModule: true }));
    jest.mock('../gc-route-changed', () => ({ default: mockGcRoute, __esModule: true }));

    const mod = require('../gc-root-store');

    gcGetters = mod.gcGetters;
    gcActions = mod.gcActions;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('gcGetters.gcStores', () => {
    it('returns stores for which gcEnabledForStore returns truthy', () => {
      const state = {
        cluster:    { someKey: 'val' },
        management: { someKey: 'val' },
        other:      { someKey: 'val' },
      };

      mockGc.gcEnabledForStore.mockImplementation((storeState: any) => storeState === state.cluster || storeState === state.management);

      expect(gcGetters.gcStores(state)).toStrictEqual([
        ['cluster', state.cluster],
        ['management', state.management],
      ]);
    });

    it('returns empty array when no stores have gc enabled', () => {
      const state = { cluster: { x: 1 }, management: { x: 2 } };

      mockGc.gcEnabledForStore.mockReturnValue(false);

      expect(gcGetters.gcStores(state)).toStrictEqual([]);
    });

    it('skips non-object state entries (primitives)', () => {
      const state: any = {
        counter: 42,
        flag:    true,
        cluster: { x: 1 },
      };

      mockGc.gcEnabledForStore.mockImplementation((s: any) => s === state.cluster);

      expect(gcGetters.gcStores(state)).toStrictEqual([['cluster', state.cluster]]);
      expect(mockGc.gcEnabledForStore).toHaveBeenCalledWith(state.cluster);
      expect(mockGc.gcEnabledForStore).not.toHaveBeenCalledWith(42);
    });

    it('returns empty array for empty state', () => {
      expect(gcGetters.gcStores({})).toStrictEqual([]);
    });
  });

  describe('gcActions.gcRouteChanged', () => {
    it('delegates to gcRoute.gcRouteChanged with ctx and to', () => {
      const ctx = { dispatch: jest.fn() };
      const to = { path: '/clusters' };

      gcActions.gcRouteChanged(ctx, to);

      expect(mockGcRoute.gcRouteChanged).toHaveBeenCalledWith(ctx, to);
    });
  });

  describe('gcActions.gcStartIntervals', () => {
    it('delegates to gcInterval.gcStartIntervals with ctx', () => {
      const ctx = { dispatch: jest.fn() };

      gcActions.gcStartIntervals(ctx);

      expect(mockGcInterval.gcStartIntervals).toHaveBeenCalledWith(ctx);
    });
  });

  describe('gcActions.gcStopIntervals', () => {
    it('delegates to gcInterval.gcStopIntervals with no arguments', () => {
      const ctx = { dispatch: jest.fn() };

      gcActions.gcStopIntervals(ctx);

      expect(mockGcInterval.gcStopIntervals).toHaveBeenCalledWith();
    });
  });

  describe('gcActions.gcResetStores', () => {
    it('dispatches gcResetStore for each gc-enabled store', () => {
      const dispatch = jest.fn();
      const getters = {
        gcStores: [
          ['cluster', {}],
          ['management', {}],
        ],
      };

      gcActions.gcResetStores({ dispatch, getters });

      expect(dispatch).toHaveBeenCalledWith('cluster/gcResetStore');
      expect(dispatch).toHaveBeenCalledWith('management/gcResetStore');
      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('dispatches nothing when gcStores is empty', () => {
      const dispatch = jest.fn();

      gcActions.gcResetStores({ dispatch, getters: { gcStores: [] } });

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('gcActions.garbageCollect', () => {
    it('dispatches garbageCollect to each gc-enabled store when gc setting is enabled', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);

      const dispatch = jest.fn();
      const getters = {
        gcStores: [
          ['cluster', {}],
          ['management', {}],
        ],
      };
      const ignoreTypes = ['some.type'];

      gcActions.garbageCollect({
        rootState: {}, dispatch, getters
      }, ignoreTypes);

      expect(dispatch).toHaveBeenCalledWith('cluster/garbageCollect', ignoreTypes);
      expect(dispatch).toHaveBeenCalledWith('management/garbageCollect', ignoreTypes);
      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('does not dispatch when gc setting is disabled', () => {
      mockGc.gcEnabledSetting.mockReturnValue(false);

      const dispatch = jest.fn();

      gcActions.garbageCollect({
        rootState: {}, dispatch, getters: { gcStores: [['cluster', {}]] }
      }, []);

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches nothing when gcStores is empty even if setting is enabled', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);

      const dispatch = jest.fn();

      gcActions.garbageCollect({
        rootState: {}, dispatch, getters: { gcStores: [] }
      }, []);

      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});
