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

  beforeEach(() => {
    mockStore = {
      getters: {
        'management/schemaFor':         jest.fn(),
        'management/all':               jest.fn(),
        'management/paginationEnabled': jest.fn(),
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

      const helper = new TopLevelMenuHelperLegacy({ $store: mockStore });

      // Test with no search, expecting pinned clusters (local + c2)
      await helper.update({
        searchTerm: '',
        pinnedIds:  [],
      });

      expect(helper.clustersPinned).toHaveLength(2);
      expect(helper.clustersPinned[0].id).toBe('local');
      expect(helper.clustersPinned[1].id).toBe('c2');
      expect(helper.clustersOthers).toHaveLength(1);
      expect(helper.clustersOthers[0].id).toBe('c1');

      // Test with search
      await helper.update({
        searchTerm: 'Cluster 1',
        pinnedIds:  [],
      });

      expect(helper.clustersOthers).toHaveLength(1);
      expect(helper.clustersOthers[0].id).toBe('c1');
    });
  });

  describe('class: TopLevelMenuHelperPagination', () => {
    it('should initialize PaginationWrappers', () => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      new TopLevelMenuHelperPagination({ $store: mockStore });
      expect(PaginationWrapper).toHaveBeenCalledTimes(3);
    });

    it('should update clusters correctly', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      const mgmtPinned = [{
        id: 'c1', nameDisplay: 'Pinned', isReady: true, pinned: true, pin: jest.fn(), unpin: jest.fn()
      }];
      const mgmtOthers = [{
        id: 'c2', nameDisplay: 'Other', isReady: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
      }];
      const provClusters = [
        { mgmtClusterId: 'c1' },
        { mgmtClusterId: 'c2' }
      ];

      const mockRequestPinned = jest.fn().mockResolvedValue({ data: mgmtPinned });
      const mockRequestOthers = jest.fn().mockResolvedValue({ data: mgmtOthers });
      const mockRequestProv = jest.fn().mockResolvedValue({ data: provClusters });

      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: mockRequestPinned, onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: mockRequestOthers, onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: mockRequestProv, onDestroy: jest.fn() }));

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      const input = {
        searchTerm: '',
        pinnedIds:  ['c1'],
      };

      await helper.update(input);

      expect(mockRequestPinned).toHaveBeenCalledWith({
        forceWatch: undefined,
        pagination: {
          filters: [{
            equals: true,
            fields: [{
              equals: true, exact: true, field: 'id', value: input.pinnedIds[0]
            }],
            param: 'filter'
          }],
          page:                 1,
          projectsOrNamespaces: [],
          sort:                 [{ asc: false, field: 'spec.internal' }, { asc: false, field: 'status.connected' }, { asc: true, field: 'spec.displayName' }]
        },
        revision: undefined
      });
      expect(mockRequestOthers).toHaveBeenCalledWith({
        forceWatch: undefined,
        pagination: {
          filters: [{
            equals: true,
            fields: [{
              equality: '!=', equals: false, exact: true, exists: false, field: 'id', value: input.pinnedIds[0]
            }],
            param: 'filter'
          }],
          page:                 1,
          pageSize:             undefined,
          projectsOrNamespaces: [],
          sort:                 [{ asc: false, field: 'spec.internal' }, { asc: false, field: 'status.connected' }, { asc: true, field: 'spec.displayName' }]
        },
        revision: undefined
      });
      expect(mockRequestProv).toHaveBeenCalledWith({
        forceWatch: undefined,
        pagination: {
          filters: [{
            equals: true,
            fields: [{
              equals: true, exact: true, field: 'status.clusterName', value: mgmtOthers[0].id
            }, {
              equals: true, exact: true, field: 'status.clusterName', value: mgmtPinned[0].id
            }],
            param: 'filter'
          }],
          page:                 1,
          projectsOrNamespaces: [],
          sort:                 []
        },
        revision: undefined
      });

      expect(helper.clustersPinned).toHaveLength(1);
      expect(helper.clustersPinned[0].id).toBe('c1');
      expect(helper.clustersOthers).toHaveLength(1);
      expect(helper.clustersOthers[0].id).toBe('c2');
    });

    it('should filter out mgmt clusters without matching prov clusters', async() => {
      mockStore.getters['management/schemaFor'].mockReturnValue(true);
      const mgmtOthers = [{
        id: 'c2', nameDisplay: 'Other', isReady: true, pinned: false, pin: jest.fn(), unpin: jest.fn()
      }];
      // No prov cluster for c2
      const provClusters: any[] = [];

      const mockRequestPinned = jest.fn().mockResolvedValue({ data: [] });
      const mockRequestOthers = jest.fn().mockResolvedValue({ data: mgmtOthers });
      const mockRequestProv = jest.fn().mockResolvedValue({ data: provClusters });

      (PaginationWrapper as unknown as jest.Mock)
        .mockImplementationOnce(() => ({ request: mockRequestPinned, onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: mockRequestOthers, onDestroy: jest.fn() }))
        .mockImplementationOnce(() => ({ request: mockRequestProv, onDestroy: jest.fn() }));

      const helper = new TopLevelMenuHelperPagination({ $store: mockStore });

      await helper.update({
        searchTerm: '',
        pinnedIds:  [],
      });

      expect(helper.clustersOthers).toHaveLength(0);
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
