import TopLevelMenuHelperService, { TopLevelMenuHelperLegacy, TopLevelMenuHelperPagination } from '../TopLevelMenu.helper';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import PaginationWrapper from '@shell/utils/pagination-wrapper';

// Mock dependencies
jest.mock('@shell/utils/pagination-wrapper');
jest.mock('@shell/utils/cluster', () => ({
  filterHiddenLocalCluster:     jest.fn((clusters) => clusters),
  filterOnlyKubernetesClusters: jest.fn((clusters) => clusters),
  paginationFilterClusters:     jest.fn(() => []),
}));

describe('topLevelMenu.helper', () => {
  let mockStore: any;
  // The shelf (pinned/recent/local) is DERIVED from these prefs, so tests set them to control
  // membership + order; `update()` only fills the cluster-data cache.
  let prefsData: Record<string, any>;

  beforeEach(() => {
    prefsData = { 'pinned-clusters': [], 'recent-clusters': [] };
    mockStore = {
      getters: {
        'management/schemaFor':         jest.fn(),
        'management/all':               jest.fn(),
        'management/paginationEnabled': jest.fn(),
        'prefs/get':                    (key: string) => prefsData[key],
      },
      dispatch: jest.fn(),
    };

    jest.clearAllMocks();
    (PaginationWrapper as unknown as jest.Mock).mockImplementation(() => ({
      request:   jest.fn().mockResolvedValue({ data: [] }),
      onDestroy: jest.fn(),
    }));
  });

  describe('class: TopLevelMenuHelperLegacy', () => {
    it('should dispatch findAll for CAPI.RANCHER_CLUSTER on init if schema exists', () => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      new TopLevelMenuHelperLegacy({ $store: mockStore });
      expect(mockStore.dispatch).toHaveBeenCalledWith('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    });

    it('should not dispatch findAll if schema does not exist', () => {
      mockStore.getters['management/schemaFor'].mockReturnValue(false);
      new TopLevelMenuHelperLegacy({ $store: mockStore });
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });

    it('should filter and sort clusters correctly in update', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      const mgmtClusters = [
        {
          id: 'c1', nameDisplay: 'Cluster 1', isReady: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
        },
        {
          id: 'c2', nameDisplay: 'Cluster 2', isReady: true, pinned: true, pin: jest.fn(), unpin: jest.fn()
        },
        {
          id: 'local', nameDisplay: 'Local', isReady: true, pinned: true, isLocal: true, pin: jest.fn(), unpin: jest.fn()
        },
      ];
      const provClusters = [
        { mgmt: { id: 'c1' } },
        { mgmt: { id: 'c2' } },
        { mgmt: { id: 'local' } },
      ];

      mockStore.getters['management/all'].mockImplementation((type: string) => {
        if (type === MANAGEMENT.CLUSTER) {
          return mgmtClusters;
        }
        if (type === CAPI.RANCHER_CLUSTER) {
          return provClusters;
        }

        return [];
      });

      prefsData['pinned-clusters'] = ['c2'];

      const helper = new TopLevelMenuHelperLegacy({ $store: mockStore });

      // `update()` fills the cluster cache from the in-memory estate; the shelf slices are DERIVED — PINNED
      // from the pinned pref, LOCAL from the cached `local`, OTHERS is the whole non-local estate.
      await helper.update({
        searchTerm: '',
        pinnedIds:  ['c2'],
      });

      expect(helper.clustersLocal.map((c) => c.id)).toStrictEqual(['local']);
      expect(helper.clustersPinned.map((c) => c.id)).toStrictEqual(['c2']);
      expect(helper.clustersOthers.map((c) => c.id)).toStrictEqual(['c1', 'c2']);

      // A search narrows the (unwatched) OTHERS list; the derived shelf (read from the pref) is unaffected.
      await helper.update({
        searchTerm: 'Cluster 1',
        pinnedIds:  ['c2'],
      });

      expect(helper.clustersOthers.map((c) => c.id)).toStrictEqual(['c1']);
      expect(helper.clustersPinned.map((c) => c.id)).toStrictEqual(['c2']);
      expect(helper.clustersLocal.map((c) => c.id)).toStrictEqual(['local']);
    });

    it('derives recents from the pref (most-recent-first, excluding pinned) and FOLLOWS pref changes (SURE-8192)', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      const mk = (id: string, pinned = false) => ({
        id, nameDisplay: id, isReady: true, canExplore: true, pinned, pin: jest.fn(), unpin: jest.fn()
      });
      const mgmtClusters = [mk('c1'), mk('c2'), mk('c3'), mk('c4'), mk('cP', true)];
      const provClusters = mgmtClusters.map((c) => ({ mgmt: { id: c.id } }));

      mockStore.getters['management/all'].mockImplementation((type: string) => {
        if (type === MANAGEMENT.CLUSTER) {
          return mgmtClusters;
        }
        if (type === CAPI.RANCHER_CLUSTER) {
          return provClusters;
        }

        return [];
      });

      prefsData['pinned-clusters'] = ['cP'];
      prefsData['recent-clusters'] = ['c3', 'c1', 'cP', 'c2', 'c4'];

      const helper = new TopLevelMenuHelperLegacy({ $store: mockStore });

      // RECENT is DERIVED from the recent pref: most-recent-first (pref/visit order), pinned 'cP' excluded,
      // capped at MENU_MAX_RECENT_CLUSTERS (10). `update()` just caches the cluster data.
      await helper.update({
        searchTerm: '',
        pinnedIds:  ['cP'],
        recentIds:  ['c3', 'c1', 'cP', 'c2', 'c4'],
      });

      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c3', 'c1', 'c2', 'c4']);

      // The shelf is a VIEW of the pref, so it FOLLOWS pref changes (no seed-lock). Shrinking the
      // recent pref shrinks the shelf immediately — the derived getter re-reads the pref.
      prefsData['recent-clusters'] = ['c3'];

      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c3']);
    });

    it('prunes a deleted cluster from the shelf when it leaves the in-memory estate (SURE-8192)', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      const mk = (id: string) => ({
        id, nameDisplay: id, canExplore: true, pin: jest.fn(), unpin: jest.fn()
      });
      let mgmtClusters = [mk('c1'), mk('c2')];
      const provFor = (list: any[]) => list.map((c) => ({ mgmt: { id: c.id } }));

      mockStore.getters['management/all'].mockImplementation((type: string) => {
        if (type === MANAGEMENT.CLUSTER) {
          return mgmtClusters;
        }
        if (type === CAPI.RANCHER_CLUSTER) {
          return provFor(mgmtClusters);
        }

        return [];
      });

      prefsData['recent-clusters'] = ['c1', 'c2'];

      const helper = new TopLevelMenuHelperLegacy({ $store: mockStore });
      const args = {
        searchTerm: '', pinnedIds: [], recentIds: ['c1', 'c2']
      };

      await helper.update(args);
      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c1', 'c2']);

      // c2 removed from the estate → the cached row must be pruned so it also leaves the recent shelf.
      mgmtClusters = [mk('c1')];
      await helper.update(args);
      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c1']);
    });
  });

  describe('class: TopLevelMenuHelperPagination', () => {
    it('should initialize PaginationWrappers', () => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      new TopLevelMenuHelperPagination({ $store: mockStore });
      // context (local+pinned+recent fetched in ONE id-IN query) + unpinned/ALL (SURE-8192)
      expect(PaginationWrapper).toHaveBeenCalledTimes(2);
    });

    it('should fetch the context set (local + pinned + recent) in ONE id-IN query and seed the shelf (SURE-8192)', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      // local + pinned + recent are fetched together by the single (watched) context wrapper, then split
      // client-side. `local` is always part of the union.
      const mgmtContext = [
        {
          id: 'local', nameDisplay: 'Local', isReady: true, canExplore: true, isLocal: true, pinned: true, pin: jest.fn(), unpin: jest.fn()
        },
        {
          id: 'c1', nameDisplay: 'Pinned', isReady: true, canExplore: true, pinned: true, pin: jest.fn(), unpin: jest.fn()
        },
      ];

      const mockRequestContext = jest.fn().mockResolvedValue({ data: mgmtContext });

      // The context wrapper is constructed FIRST.
      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: mockRequestContext, onDestroy: jest.fn() }));

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      const input = {
        searchTerm: '',
        pinnedIds:  ['c1'],
      };

      prefsData['pinned-clusters'] = ['c1'];

      await helper.update(input);

      // ONE context query: id IN (local, ...pinned, ...recent). With no recents the union is [local, c1].
      expect(mockRequestContext).toHaveBeenCalledWith({
        forceWatch: undefined,
        pagination: {
          filters: [{
            equals: true,
            fields: [
              {
                equals: true, exact: true, field: 'id', value: 'local'
              },
              {
                equals: true, exact: true, field: 'id', value: 'c1'
              }
            ],
            param: 'filter'
          }],
          page:                 1,
          // no explicit pageSize — uses the store default (100000), far larger than the id-IN union, so the
          // whole requested set returns in one page (the basis for the deleted-cluster prune)
          projectsOrNamespaces: [],
          sort:                 [{ asc: false, field: 'spec.internal' }, { asc: false, field: 'status.connected' }, { asc: true, field: 'spec.displayName' }]
        },
        revision: undefined
      });

      // Derived split: `local` from the cached `local`, PINNED from the pinned pref (c1). `clustersOthers`
      // is NOT touched by update (the ALL list is fetched separately on open/scroll).
      expect(helper.clustersLocal.map((c) => c.id)).toStrictEqual(['local']);
      expect(helper.clustersPinned.map((c) => c.id)).toStrictEqual(['c1']);
      expect(helper.clustersOthers).toHaveLength(0);
    });

    it('should fetch recents within the single context query and order them by visit order, excluding pinned (SURE-8192)', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      // The context wrapper returns rows in the API's default sort, NOT visit order
      const mgmtContext = [
        {
          id: 'c2', nameDisplay: 'Two', isReady: true, canExplore: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
        },
        {
          id: 'c9', nameDisplay: 'Nine', isReady: true, canExplore: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
        },
        {
          id: 'c5', nameDisplay: 'Five', isReady: true, canExplore: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
        },
      ];

      const mockRequestContext = jest.fn().mockResolvedValue({ data: mgmtContext });

      // The context wrapper is constructed FIRST.
      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: mockRequestContext, onDestroy: jest.fn() }));

      prefsData['pinned-clusters'] = ['cP'];
      prefsData['recent-clusters'] = ['c5', 'c9', 'cP', 'c2'];

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      await helper.update({
        searchTerm: '',
        pinnedIds:  ['cP'],
        // 'cP' is pinned (excluded from RECENT); visit order c5, c9, c2 must be preserved regardless of API sort
        recentIds:  ['c5', 'c9', 'cP', 'c2'],
      });

      // The ONE context query asks for the union: local + pinned + (non-pinned) recent ids.
      const contextFilters = mockRequestContext.mock.calls[0][0].pagination.filters;
      const requestedIds = contextFilters[contextFilters.length - 1].fields.map((f: any) => f.value);

      expect(requestedIds).toStrictEqual(['local', 'cP', 'c5', 'c9', 'c2']);
      // clustersRecent is DERIVED from the recent pref: pinned ('cP') excluded, in pref/visit order (not the
      // API's returned order), matched to the cached rows.
      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c5', 'c9', 'c2']);
    });

    it('prunes a deleted cluster from the shelf: a requested id the fetch no longer returns is dropped (SURE-8192)', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);

      // First fetch returns both recents; second fetch (after c9 is deleted) returns only c5.
      const mockRequestContext = jest.fn()
        .mockResolvedValueOnce({
          data: [
            {
              id: 'c5', nameDisplay: 'Five', canExplore: true, pin: jest.fn(), unpin: jest.fn()
            },
            {
              id: 'c9', nameDisplay: 'Nine', canExplore: true, pin: jest.fn(), unpin: jest.fn()
            },
          ]
        })
        .mockResolvedValueOnce({
          data: [{
            id: 'c5', nameDisplay: 'Five', canExplore: true, pin: jest.fn(), unpin: jest.fn()
          }]
        });

      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: mockRequestContext, onDestroy: jest.fn() }));

      prefsData['recent-clusters'] = ['c5', 'c9'];

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });
      const args = {
        searchTerm: '', pinnedIds: [], recentIds: ['c5', 'c9']
      };

      await helper.update(args);
      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c5', 'c9']);

      // c9 deleted → the watch re-runs update; the fetch omits c9, so it must leave the shelf (not linger
      // from the cache). We do NOT backfill — the shelf just shows c5.
      await helper.update(args);
      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c5']);
    });

    it('runs the context query on update even while a search term is set (SURE-8192)', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);

      const mockRequestContext = jest.fn().mockResolvedValue({ data: [] });

      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: mockRequestContext, onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: jest.fn().mockResolvedValue({ data: [] }), onDestroy: jest.fn() }));

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      await helper.update({
        searchTerm: 'prod',
        pinnedIds:  [],
        recentIds:  ['c5', 'c9'],
      });

      // update() always refreshes the watched context set (local + pinned + recent), search term or not.
      expect(mockRequestContext).toHaveBeenCalledTimes(1);
      // The context query returned no rows, so nothing is cached — the derived RECENT shelf is empty.
      expect(helper.clustersRecent).toHaveLength(0);
    });
  });

  describe('class: TopLevelMenuHelperService', () => {
    beforeEach(async() => {
      await TopLevelMenuHelperService.reset();
    });

    it('should throw error if helper is accessed before init', () => {
      expect(() => TopLevelMenuHelperService.helper).toThrow('Unable to use the side nav cluster helper (not initialised)');
    });

    it('should initialize with Legacy helper when pagination is disabled', () => {
      mockStore.getters['management/paginationEnabled'].mockReturnValue(false);

      TopLevelMenuHelperService.init(mockStore);

      expect(TopLevelMenuHelperService.helper).toBeInstanceOf(TopLevelMenuHelperLegacy);
    });

    it('should initialize with Pagination helper when pagination is enabled', () => {
      mockStore.getters['management/paginationEnabled'].mockReturnValue(true);

      TopLevelMenuHelperService.init(mockStore);

      expect(TopLevelMenuHelperService.helper).toBeInstanceOf(TopLevelMenuHelperPagination);
    });

    it('should not re-initialize if already initialized', () => {
      mockStore.getters['management/paginationEnabled'].mockReturnValue(false);
      TopLevelMenuHelperService.init(mockStore);
      const helper1 = TopLevelMenuHelperService.helper;

      // Change condition
      mockStore.getters['management/paginationEnabled'].mockReturnValue(true);
      TopLevelMenuHelperService.init(mockStore);
      const helper2 = TopLevelMenuHelperService.helper;

      expect(helper1).toBe(helper2);
      expect(helper2).toBeInstanceOf(TopLevelMenuHelperLegacy);
    });

    it('should reset correctly', async() => {
      mockStore.getters['management/paginationEnabled'].mockReturnValue(false);
      TopLevelMenuHelperService.init(mockStore);

      const helper = TopLevelMenuHelperService.helper;
      const destroySpy = jest.spyOn(helper, 'destroy');

      await TopLevelMenuHelperService.reset();

      expect(destroySpy).toHaveBeenCalledWith();
      expect(() => TopLevelMenuHelperService.helper).toThrow('Unable to use the side nav cluster helper (not initialised)');
    });
  });
});
