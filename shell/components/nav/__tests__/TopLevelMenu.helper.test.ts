import TopLevelMenuHelperService, { TopLevelMenuHelperLegacy, TopLevelMenuHelperPagination, visibleRecentClusters } from '../TopLevelMenu.helper';
import { CAPI, MANAGEMENT, SAVED_COUNTS } from '@shell/config/types';
import PaginationWrapper from '@shell/utils/pagination-wrapper';
import { RECENT_CLUSTERS_FETCHED } from '@shell/store/prefs';
import { filterHiddenLocalCluster, isLocalClusterHidden } from '@shell/utils/cluster';

// Mock dependencies
jest.mock('@shell/utils/pagination-wrapper');
jest.mock('@shell/utils/cluster', () => ({
  filterHiddenLocalCluster:     jest.fn((clusters) => clusters),
  filterOnlyKubernetesClusters: jest.fn((clusters) => clusters),
  paginationFilterClusters:     jest.fn(() => []),
  isLocalClusterHidden:         jest.fn(() => false),
}));

describe('topLevelMenu.helper', () => {
  let mockStore: any;
  // The shelf (pinned/recent/local) is DERIVED from these prefs, so tests set them to control
  // membership + order; `update()` only fills the cluster-data cache.
  let prefsData: Record<string, any>;

  beforeEach(() => {
    (isLocalClusterHidden as jest.Mock).mockReturnValue(false);
    (filterHiddenLocalCluster as jest.Mock).mockImplementation((clusters) => clusters);
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

    // `local` is not in the flyout's list either way — it has its own fixed tile, or hide-local-cluster has
    // removed it outright — so the switcher's total reads the same with the setting on. Deriving it from a
    // count that still held `local` while the shelf slice it subtracted had already lost it gained one.
    it('counts the same browsable total whether or not hide-local-cluster is on', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);

      const mgmtClusters = [
        {
          id: 'c1', nameDisplay: 'Cluster 1', isReady: true, pin: jest.fn(), unpin: jest.fn()
        },
        {
          id: 'local', nameDisplay: 'Local', isReady: true, isLocal: true, pin: jest.fn(), unpin: jest.fn()
        },
      ];

      mockStore.getters['management/all'].mockImplementation((type: string) => {
        if (type === MANAGEMENT.CLUSTER) {
          return mgmtClusters;
        }
        if (type === CAPI.RANCHER_CLUSTER) {
          return [{ mgmt: { id: 'c1' } }, { mgmt: { id: 'local' } }];
        }

        return [];
      });

      const stateWithHideLocal = async(hideLocal: boolean) => {
        (filterHiddenLocalCluster as jest.Mock).mockImplementation((clusters: any[]) => (hideLocal ? clusters.filter((c) => !c.isLocal) : clusters));

        const helper = new TopLevelMenuHelperLegacy({ $store: mockStore });

        await helper.update({ searchTerm: '', pinnedIds: [] });

        return { browsable: helper.counts.browsable, localSlice: helper.clustersLocal.length };
      };

      const shown = await stateWithHideLocal(false);
      const hidden = await stateWithHideLocal(true);

      expect(shown.browsable).toBe(1);
      expect(hidden.browsable).toBe(1);

      // And here is the trap the old derivation fell into: the shelf's `local` slice DOES move with the
      // setting, so a chip that subtracted `local` on the strength of it counted one cluster too many.
      expect(shown.localSlice).toBe(1);
      expect(hidden.localSlice).toBe(0);
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

    it('derives recents from the pref (most-recent-first, pinned included) and FOLLOWS pref changes', async() => {
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

      // RECENT is DERIVED from the recent pref: most-recent-first (pref/visit order), capped at
      // SWITCHER_MAX_RECENT. The pinned 'cP' keeps its place — being pinned no longer hides a
      // cluster from the visit history. `update()` just caches the cluster data.
      await helper.update({
        searchTerm: '',
        pinnedIds:  ['cP'],
        recentIds:  ['c3', 'c1', 'cP', 'c2', 'c4'],
      });

      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c3', 'c1', 'cP', 'c2', 'c4']);

      // The shelf is a VIEW of the pref, so it FOLLOWS pref changes (no seed-lock). Shrinking the
      // recent pref shrinks the shelf immediately — the derived getter re-reads the pref.
      prefsData['recent-clusters'] = ['c3'];

      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c3']);
    });

    it('prunes a deleted cluster from the shelf when it leaves the in-memory estate', async() => {
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
      // context (local + pinned, watched) + RECENTLY USED (unwatched, on open) + unpinned/ALL
      expect(PaginationWrapper).toHaveBeenCalledTimes(3);
    });

    it('should fetch the context set (local + pinned + recent) in ONE id-IN query and seed the shelf', async() => {
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

    // RECENTLY USED is its own unwatched request now, made when the flyout opens: it is only on screen
    // there, so it is read fresh rather than kept live by a watch. It asks for more ids than it shows,
    // because an id can stop resolving, and takes the first that come back IN VISIT ORDER — not the order
    // the API returns them in.
    it('fetches recents on demand, in visit order, capped to what the flyout shows', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      const mgmtRecent = ['c2', 'c9', 'c5', 'c1', 'c7', 'c3'].map((id) => ({
        id, nameDisplay: id, isReady: true, canExplore: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
      }));
      const mockRequestContext = jest.fn().mockResolvedValue({ data: [] });
      const mockRequestRecent = jest.fn().mockResolvedValue({ data: mgmtRecent });

      // Constructed in order: context, recent, others.
      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: mockRequestContext, onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: mockRequestRecent, onDestroy: jest.fn() }));

      prefsData['recent-clusters'] = ['c5', 'c9', 'cP', 'c2', 'c1', 'c7', 'c3'];

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      await helper.refreshRecent();

      const filters = mockRequestRecent.mock.calls[0][0].pagination.filters;
      const requestedIds = filters[filters.length - 1].fields.map((f: any) => f.value);

      expect(requestedIds).toStrictEqual(['c5', 'c9', 'cP', 'c2', 'c1', 'c7', 'c3']);
      // The ids are an exact OR-set, so the answer can never be longer than the ids asked for: the page
      // is sized to that cap rather than the store default of 100000. Asserted against the constant that
      // caps the ids, so the two cannot drift apart and start truncating the list.
      expect(mockRequestRecent.mock.calls[0][0].pagination.pageSize).toBe(RECENT_CLUSTERS_FETCHED);
      // Visit order, five of them, and 'cP' dropped because the fetch did not return it.
      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c5', 'c9', 'c2', 'c1', 'c7']);
    });

    // Two opens in quick succession put two requests in flight. Only the newest may write the list — an
    // older response landing last would replace it with staler rows.
    it('lets only the newest recent fetch write the list', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      const row = (id: string) => ({
        id, nameDisplay: id, isReady: true, canExplore: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
      });
      let settleFirst: (v: any) => void = () => {};
      const mockRequestRecent = jest.fn()
        .mockImplementationOnce(() => new Promise((resolve) => {
          settleFirst = resolve;
        }))
        .mockResolvedValueOnce({ data: [row('c2')] });

      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: jest.fn().mockResolvedValue({ data: [] }), onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: mockRequestRecent, onDestroy: jest.fn() }));

      prefsData['recent-clusters'] = ['c1', 'c2'];

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });
      const first = helper.refreshRecent();

      await helper.refreshRecent();
      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c2']);

      // The stale response lands last and must be ignored.
      settleFirst({ data: [row('c1')] });
      await first;

      expect(helper.clustersRecent.map((c) => c.id)).toStrictEqual(['c2']);
    });

    // The watch is for what the NAV shows for as long as it is on screen. RECENTLY USED is not that.
    it('watches local and pinned only', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      const mockRequestContext = jest.fn().mockResolvedValue({ data: [] });

      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: mockRequestContext, onDestroy: jest.fn() }));

      prefsData['pinned-clusters'] = ['cP'];
      prefsData['recent-clusters'] = ['c5', 'c9'];

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      await helper.update({
        searchTerm: '', pinnedIds: ['cP'], recentIds: ['c5', 'c9']
      });

      const contextFilters = mockRequestContext.mock.calls[0][0].pagination.filters;
      const requestedIds = contextFilters[contextFilters.length - 1].fields.map((f: any) => f.value);

      expect(requestedIds).toStrictEqual(['local', 'cP']);
    });


    // The prune covers what the watch keeps live — local and PINNED. RECENTLY USED is not on the watch any
    // more; it is simply re-read (and re-cut) the next time the flyout opens.
    it('prunes a deleted cluster from the pinned shelf: a requested id the fetch no longer returns is dropped', async() => {
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

      prefsData['pinned-clusters'] = ['c5', 'c9'];

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });
      const args = {
        searchTerm: '', pinnedIds: ['c5', 'c9'], recentIds: []
      };

      await helper.update(args);
      expect(helper.clustersPinned.map((c) => c.id)).toStrictEqual(['c5', 'c9']);

      // c9 deleted → the watch re-runs update; the fetch omits c9, so it must leave the shelf (not linger
      // from the cache). We do NOT backfill — the shelf just shows c5.
      await helper.update(args);
      expect(helper.clustersPinned.map((c) => c.id)).toStrictEqual(['c5']);
    });

    it('runs the context query on update even while a search term is set', async() => {
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

    const countRequests = () => mockStore.dispatch.mock.calls
      .filter((c: any[]) => c[0] === 'management/findPage')
      .map((c: any[]) => c[1].opt);

    // The saved count is SHARED with the home page and the Cluster Management nav badge, which list
    // `local` too — so it counts what the environment actually shows and nothing more. It is refreshed
    // even with nothing being filtered out: a count saved while the filters were NOT empty would
    // otherwise stay behind and have consumers reporting a filtered total for an unfiltered estate.
    it('refreshes the shared count even when nothing is being filtered out', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      mockStore.dispatch.mockResolvedValue({ data: [], pagination: { result: { count: 7 } } });

      // paginationFilterClusters is mocked to [] — nothing to exclude.
      await helper.updateCount(7);

      const shared = countRequests().find((opt: any) => opt.saveCountAs === SAVED_COUNTS.K8S_CLUSTERS);

      expect(shared?.pagination?.filters).toStrictEqual([]);
    });

    // The switcher's own total is counted by a SEPARATE query that always excludes `local`, because the
    // flyout's list never carries it. Deriving it from the shared count instead meant subtracting `local`
    // on a guess, and `hide-local-cluster` moved the chip by one.
    it('counts the switcher browsable total with its own query, always excluding local', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      mockStore.dispatch.mockResolvedValue({ data: [], pagination: { result: { count: 22 } } });

      await helper.updateCount(23);

      const own = countRequests().filter((opt: any) => !opt.saveCountAs);

      expect(own).toHaveLength(1);
      // paginationFilterClusters is mocked to [], so the local exclusion is the only filter left standing.
      expect(own[0].pagination.filters).toHaveLength(1);
      expect(helper.counts.browsable).toBe(22);
    });

    // The invariance the chip rests on: its query excludes `local` on its own account, not because the
    // environment happens to. Whatever hide-local is doing, the total means the same thing.
    it('excludes local from the switcher query whether or not hide-local-cluster is on', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);

      const ownQueryFilters = async(hideLocal: boolean) => {
        (isLocalClusterHidden as jest.Mock).mockReturnValue(hideLocal);
        mockStore.dispatch.mockClear();

        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockResolvedValue({ data: [], pagination: { result: { count: 22 } } });
        await helper.updateCount(23);

        const own = countRequests().filter((opt: any) => !opt.saveCountAs);

        return { filters: own[0].pagination.filters, browsable: helper.counts.browsable };
      };

      const shown = await ownQueryFilters(false);
      const hidden = await ownQueryFilters(true);

      // paginationFilterClusters is mocked to [], so the local exclusion is the only filter left standing
      // — and it is there either way, which is what keeps the total from moving.
      expect(shown.filters).toHaveLength(1);
      expect(hidden.filters).toHaveLength(1);
      expect(shown.browsable).toBe(22);
      expect(hidden.browsable).toBe(22);
    });

    // `hide-local-cluster` is one of the shared count's filters, so flipping it changes that answer while
    // leaving the number of clusters alone. Guarding on the number only left the shared count behind for
    // the home page and the Cluster Management badge.
    it('re-fetches when hide-local-cluster flips, on an unchanged cluster count', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      mockStore.dispatch.mockResolvedValue({ data: [], pagination: { result: { count: 7 } } });

      await helper.updateCount(7);
      expect(countRequests()).toHaveLength(2);

      // Same count, same setting — nothing to do.
      await helper.updateCount(7);
      expect(countRequests()).toHaveLength(2);

      (isLocalClusterHidden as jest.Mock).mockReturnValue(true);
      await helper.updateCount(7);
      expect(countRequests()).toHaveLength(4);
    });

    // The switcher's door hangs off the browsable count, so what happens when a count request fails is not
    // a cosmetic question: it decides whether the nav still has a cluster switcher in it.
    describe('when a count request fails', () => {
      // Shared count rejects, the switcher's own resolves.
      const halfFailing = () => (action: string, payload?: any) => {
        if (action !== 'management/findPage') {
          return Promise.resolve();
        }

        return payload.opt.saveCountAs ? Promise.reject(new Error('count request failed')) : Promise.resolve({ data: [], pagination: { result: { count: 22 } } });
      };

      beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        mockStore.getters['management/schemaFor'].mockReturnValue(true);
      });

      afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
        jest.useRealTimers();
      });

      // The two counts answer different questions and are requested together; `Promise.all` would have
      // thrown away the answer that arrived because the other one did not.
      it('keeps the count that succeeded', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockImplementation(halfFailing());

        await helper.updateCount(23);

        expect(helper.counts.browsable).toBe(22);

        helper.destroy();
      });

      // Nothing re-triggers on an unchanged cluster count, so remembering the attempt before it succeeded
      // made one failed request permanent — every later call matched the guard and returned.
      it('does not treat the attempt as answered, so a later call asks again', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockImplementation(halfFailing());

        await helper.updateCount(23);
        const afterFirst = countRequests().length;

        // Same count, same setting: this is the call the guard used to swallow.
        await helper.updateCount(23);

        expect(countRequests().length).toBeGreaterThan(afterFirst);

        helper.destroy();
      });

      // ...and because that later call may never come, it asks again on its own.
      it('retries on a timer, and stops once both land', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockImplementation(halfFailing());

        await helper.updateCount(23);
        const afterFirst = countRequests().length;

        await jest.advanceTimersByTimeAsync(2000);
        expect(countRequests().length).toBeGreaterThan(afterFirst);

        // The estate comes back: the retry settles both counts and schedules nothing further.
        mockStore.dispatch.mockResolvedValue({ data: [], pagination: { result: { count: 22 } } });
        await jest.advanceTimersByTimeAsync(6000);

        const afterRecovery = countRequests().length;

        await jest.advanceTimersByTimeAsync(60000);
        expect(countRequests()).toHaveLength(afterRecovery);

        helper.destroy();
      });

      // Only the browsable query fails this time. The chip has a number already and it is still the best
      // one available — zeroing it would take the door down over a single blip.
      it('keeps the last total it knew when the browsable query fails', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockResolvedValue({ data: [], pagination: { result: { count: 22 } } });
        await helper.updateCount(23);
        expect(helper.counts.browsable).toBe(22);

        mockStore.dispatch.mockImplementation((action: string, payload?: any) => {
          if (action !== 'management/findPage') {
            return Promise.resolve();
          }

          return payload.opt.saveCountAs ? Promise.resolve({ data: [], pagination: { result: { count: 23 } } }) : Promise.reject(new Error('count request failed'));
        });
        await helper.updateCount(24);

        expect(helper.counts.browsable).toBe(22);

        helper.destroy();
      });

      it('retries when both requests fail', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockRejectedValue(new Error('offline'));

        await helper.updateCount(23);
        const afterFirst = countRequests().length;

        await jest.advanceTimersByTimeAsync(2000);

        expect(countRequests().length).toBeGreaterThan(afterFirst);

        helper.destroy();
      });

      // A request can resolve without answering the question. Counting that as an answer would record the
      // attempt and leave the chip on a total nothing ever asked for again.
      it('treats a response carrying no total as a failure', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockResolvedValue({ data: [] });

        await helper.updateCount(23);
        const afterFirst = countRequests().length;

        await jest.advanceTimersByTimeAsync(2000);

        expect(countRequests().length).toBeGreaterThan(afterFirst);

        helper.destroy();
      });

      // Giving up is what makes an outage permanent: nothing else asks again on an unchanged cluster
      // count, so the door would stay down until the page is reloaded.
      it('keeps retrying rather than giving up', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockRejectedValue(new Error('offline'));

        await helper.updateCount(23);
        await jest.advanceTimersByTimeAsync(10 * 60 * 1000);

        // Two requests per attempt; the delay ceiling keeps a long outage to roughly one attempt a minute.
        expect(countRequests().length / 2).toBeGreaterThan(6);

        helper.destroy();
      });

      // A retry can fire long after it was scheduled. What it records has to be the setting its requests
      // actually went out with, or the guard swallows the refresh for the setting now in effect.
      it('records the hide-local state the retry actually fetched with', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockImplementation(halfFailing());
        await helper.updateCount(23);

        // The setting flips while the retry is pending, and the retry is what succeeds.
        (isLocalClusterHidden as jest.Mock).mockReturnValue(true);
        mockStore.dispatch.mockResolvedValue({ data: [], pagination: { result: { count: 22 } } });
        await jest.advanceTimersByTimeAsync(2000);

        const settled = countRequests().length;

        // Same count, and hide-local is still on: already answered, nothing to ask.
        await helper.updateCount(23);
        expect(countRequests()).toHaveLength(settled);

        // Flip it back and it must ask again.
        (isLocalClusterHidden as jest.Mock).mockReturnValue(false);
        await helper.updateCount(23);
        expect(countRequests().length).toBeGreaterThan(settled);

        helper.destroy();
      });

      // A retry left running would keep firing at a torn-down helper.
      it('drops a pending retry on destroy', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

        mockStore.dispatch.mockImplementation(halfFailing());

        await helper.updateCount(23);
        helper.destroy();

        const afterDestroy = countRequests().length;

        await jest.advanceTimersByTimeAsync(60000);

        expect(countRequests()).toHaveLength(afterDestroy);
      });

      // Clearing the pending timer is not enough on its own: a request still in flight settles after the
      // teardown and would schedule a fresh retry from there.
      it('drops a retry that an in-flight request would have scheduled', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });
        const rejectors: Array<(e: any) => void> = [];

        mockStore.dispatch.mockImplementation((action: string) => {
          if (action !== 'management/findPage') {
            return Promise.resolve();
          }

          return new Promise((_resolve, reject) => rejectors.push(reject));
        });

        const inFlight = helper.updateCount(23);

        helper.destroy();

        // The requests only fail once the helper is already gone.
        rejectors.forEach((reject) => reject(new Error('offline')));
        await inFlight;

        const afterDestroy = countRequests().length;

        await jest.advanceTimersByTimeAsync(60000);

        expect(countRequests()).toHaveLength(afterDestroy);
      });

      // Two refreshes overlap on the ordinary startup path alone: the nav asks once before the live counts
      // have loaded, then again when they arrive. An older response landing last must not put its total
      // back.
      it('ignores a response a newer refresh has overtaken', async() => {
        const helper = new TopLevelMenuHelperPagination({ $store: mockStore });
        const resolvers: Array<(v: any) => void> = [];

        mockStore.dispatch.mockImplementation((action: string) => {
          if (action !== 'management/findPage') {
            return Promise.resolve();
          }

          return new Promise((resolve) => resolvers.push(resolve));
        });

        const page = (count: number) => ({ data: [], pagination: { result: { count } } });

        const first = helper.updateCount(10); // resolvers 0 + 1
        const second = helper.updateCount(20); // resolvers 2 + 3

        // The newer pair answers first...
        resolvers[2](page(20));
        resolvers[3](page(20));
        await second;

        // ...and then the older pair reports what it saw.
        resolvers[0](page(10));
        resolvers[1](page(10));
        await first;

        expect(helper.counts.browsable).toBe(20);

        helper.destroy();
      });
    });

    it('rewinds the ALL-list page counter when a page fetch fails, so the next scroll re-requests it', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);

      const page = (ids: string[]) => ({
        data: ids.map((id) => ({
          id, nameDisplay: id, isReady: true, canExplore: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
        })),
        pagination: { result: { count: 60, pages: 3 } },
      });

      const mockRequestOthers = jest.fn()
        .mockResolvedValueOnce(page(['c1'])) // page 1
        .mockRejectedValueOnce(new Error('offline')) // page 2 — fails
        .mockResolvedValueOnce(page(['c2'])); // the retry must ask for page 2 again, not skip to 3

      // Construction order: context, then RECENTLY USED, then the ALL/others wrapper.
      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: jest.fn().mockResolvedValue({ data: [] }), onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: jest.fn().mockResolvedValue({ data: [] }), onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: mockRequestOthers, onDestroy: jest.fn() }));

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      await helper.resetOthers({ searchTerm: '', pinnedIds: [] });
      await expect(helper.loadMoreOthers()).rejects.toThrow('offline');
      await helper.loadMoreOthers();

      // Without the rewind the third call would ask for page 3 and clusters on page 2 would be
      // unreachable for the lifetime of the flyout.
      expect(mockRequestOthers.mock.calls.map((c: any[]) => c[0].pagination.page)).toStrictEqual([1, 2, 2]);
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

  describe('visibleRecentClusters', () => {
    it('keeps visit order and caps at the display limit', () => {
      expect(visibleRecentClusters(['c-a', 'c-b', 'c-c', 'c-d', 'c-e'], 3)).toStrictEqual(['c-a', 'c-b', 'c-c']);
    });

    // Pinning says "keep this to hand", not "forget where I have been" — a pinned cluster still holds
    // its place in the visit history, so it can appear under both headings.
    it('keeps a cluster that is also pinned', () => {
      expect(visibleRecentClusters(['c-a', 'c-b'], 3)).toStrictEqual(['c-a', 'c-b']);
    });

    it('tolerates non-array inputs', () => {
      expect(visibleRecentClusters(undefined as any, 3)).toStrictEqual([]);
    });
  });
});
