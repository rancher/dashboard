import { useWorkloadDashboard } from '@shell/pages/c/_cluster/explorer/workload-dashboard/composable';
import { WORKLOAD_RESOURCE_TYPES } from '@shell/pages/c/_cluster/explorer/workload-dashboard/types';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { defineComponent, h } from 'vue';
import { shallowMount, flushPromises } from '@vue/test-utils';

const WORKLOAD_DASHBOARD_ROUTE = 'c-cluster-explorer-workload-dashboard';

const mockGetters: Record<string, any> = {};
const mockDispatch = jest.fn();
const mockRouterPush = jest.fn();
const mockCurrentRoute = { value: { name: WORKLOAD_DASHBOARD_ROUTE } };

jest.mock('vuex', () => ({
  useStore: () => ({
    getters: new Proxy(mockGetters, {
      get(target, prop: string) {
        return target[prop];
      },
    }),
    dispatch: mockDispatch,
  }),
}));

jest.mock('vue-router', () => ({ useRouter: () => ({ push: mockRouterPush, currentRoute: mockCurrentRoute }) }));

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string, args?: Record<string, any>) => `%${ key }%${ args ? JSON.stringify(args) : '' }` }) }));

jest.mock('@shell/plugins/steve/steve-pagination-utils', () => ({
  __esModule: true,
  default:    {
    createParamsFromNsFilter:  jest.fn(() => ({ projectsOrNamespaces: [], filters: [] })),
    createParamsForPagination: jest.fn(() => ''),
  },
}));

jest.mock('@shell/plugins/steve/projectAndNamespaceFiltering.utils', () => ({
  __esModule: true,
  default:    { createParam: jest.fn(() => '') },
}));

const defaultGetters: Record<string, any> = {
  clusterId:           'local',
  isAllNamespaces:     true,
  namespaceFilters:    [],
  namespaceMode:       'both',
  'prefs/get':         () => ({}),
  'cluster/all':       () => [],
  'cluster/schemaFor': () => null,
  currentCluster:      { isLocal: true },
  currentProduct:      { hideSystemResources: false },
  'management/all':    () => [],
};

Object.assign(mockGetters, defaultGetters);

function setupGetters(overrides: Record<string, any> = {}) {
  Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
  Object.assign(mockGetters, defaultGetters, overrides);
}

const summaryResponse = {
  summary: [{
    property: 'metadata.state.name',
    counts:   {
      running: { total: 5, namespace: { default: 5 } },
      error:   { total: 2, namespace: { default: 2 } },
    }
  }],
  data: [],
};

function mountComposable(getterOverrides: Record<string, any> = {}, dispatchResponse: any = summaryResponse) {
  setupGetters({
    'cluster/schemaFor': () => ({ links: { collection: '/v1/test' } }),
    'cluster/urlFor':    () => '/v1/test',
    'cluster/canList':   () => true,
    ...getterOverrides,
  });

  mockDispatch.mockImplementation((action: string) => {
    if (action === 'cluster/request') {
      return Promise.resolve(dispatchResponse);
    }

    return Promise.resolve();
  });

  let result: ReturnType<typeof useWorkloadDashboard>;

  const wrapper = shallowMount(defineComponent({
    setup() {
      result = useWorkloadDashboard();

      return {};
    },
    render: () => h('div'),
  }));

  return {
    wrapper,
    get result() {
      return result!;
    },
  };
}

describe('composable: useWorkloadDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupGetters();
    mockCurrentRoute.value.name = WORKLOAD_DASHBOARD_ROUTE;
  });

  describe('namespaceSubtitle', () => {
    it('should return allNamespaces subtitle with workloadCount suffix when isAllNamespaces is true', async() => {
      const { wrapper, result } = mountComposable({ isAllNamespaces: true, namespaceMode: 'both' });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.allNamespaces% %workloadDashboard.workloadCount%{"count":42}');
      wrapper.unmount();
    });

    it('should return userNamespaces subtitle with workloadCount suffix for ALL_USER filter', async() => {
      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: ['all://user'],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.userNamespaces% %workloadDashboard.workloadCount%{"count":42}');
      wrapper.unmount();
    });

    it('should return systemNamespaces subtitle with workloadCount suffix for ALL_SYSTEM filter', async() => {
      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: ['all://system'],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.systemNamespaces% %workloadDashboard.workloadCount%{"count":42}');
      wrapper.unmount();
    });

    it('should return project subtitle with workloadCount suffix for project filter', async() => {
      const projectId = 'p-12345';

      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: [`project://${ projectId }`],
        'management/all': () => [{
          id: `local/${ projectId }`, nameDisplay: 'My Project', metadata: { name: projectId }
        }],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.project%{"name":"My Project"} %workloadDashboard.workloadCount%{"count":42}');
      wrapper.unmount();
    });

    it('should return namespace subtitle with workloadCount suffix for namespace filter', async() => {
      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: ['ns://cattle-system'],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.namespace%{"name":"cattle-system"} %workloadDashboard.workloadCount%{"count":42}');
      wrapper.unmount();
    });

    it('should return multipleSelected subtitle with workloadCount suffix for multiple filters', async() => {
      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: ['ns://default', 'ns://kube-system'],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.multipleSelected%{"selected":2} %workloadDashboard.workloadCount%{"count":42}');
      wrapper.unmount();
    });

    it('should pass count 0 to workloadCount when no workloads exist', async() => {
      const emptyResponse = {
        summary: [{
          property: 'metadata.state.name',
          counts:   {}
        }],
        data: [],
      };

      const { wrapper, result } = mountComposable({ isAllNamespaces: true }, emptyResponse);

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.allNamespaces% %workloadDashboard.workloadCount%{"count":0}');
      wrapper.unmount();
    });

    it('should pass count 1 to workloadCount for a single workload', async() => {
      const singleResponse = {
        summary: [{
          property: 'metadata.state.name',
          counts:   { running: { total: 1, namespace: { default: 1 } } }
        }],
        data: [],
      };

      const { wrapper, result } = mountComposable({
        isAllNamespaces:   true,
        'cluster/canList': (type: string) => type === 'apps.deployment',
      }, singleResponse);

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.allNamespaces% %workloadDashboard.workloadCount%{"count":1}');
      wrapper.unmount();
    });

    it('should not count entries with errors in the workloadCount total', async() => {
      const errorResponse = {
        summary: null,
        error:   'No access',
      };

      const { wrapper, result } = mountComposable({ isAllNamespaces: true }, errorResponse);

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.allNamespaces% %workloadDashboard.workloadCount%{"count":0}');
      wrapper.unmount();
    });
  });

  describe('hasWorkloads', () => {
    it('should return false when there are no summaries', async() => {
      const { wrapper, result } = mountComposable({ 'cluster/canList': () => false });

      await flushPromises();

      expect(result.hasWorkloads.value).toStrictEqual(false);
      wrapper.unmount();
    });

    it('should return true when summaries contain workloads', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.hasWorkloads.value).toStrictEqual(true);
      wrapper.unmount();
    });
  });

  describe('resourceRoute', () => {
    it('should return route without query when no stateNames provided', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      const route = result.resourceRoute('apps.deployment');

      expect(route).toStrictEqual({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  'local',
          product:  'explorer',
          resource: 'apps.deployment',
        },
      });
      wrapper.unmount();
    });

    it('should include state filter query when stateNames are provided', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      const route = result.resourceRoute('apps.deployment', ['running', 'active']);

      expect((route as any).query).toStrictEqual({ stateFilter: 'running,active' });
      wrapper.unmount();
    });

    it('should not include query for empty stateNames array', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      const route = result.resourceRoute('apps.deployment', []);

      expect((route as any).query).toBeUndefined();
      wrapper.unmount();
    });
  });

  describe('resetNamespaceFilter', () => {
    it('should dispatch switchNamespaces with empty ids', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      result.resetNamespaceFilter();

      expect(mockDispatch).toHaveBeenCalledWith('switchNamespaces', { ids: [], key: 'local' });
      wrapper.unmount();
    });
  });

  describe('byTypeCards', () => {
    it('should return a card for each workload type with data', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.byTypeCards.value).toHaveLength(WORKLOAD_RESOURCE_TYPES.length);
      wrapper.unmount();
    });

    it('should include type and title on each card', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];

      expect(card.type).toStrictEqual(WORKLOAD_RESOURCE_TYPES[0]);
      expect(card.title).toBeTruthy();
      wrapper.unmount();
    });

    it('should map resource states with correct colors', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];
      const colors = card.resources.map((r) => r.stateSimpleColor);

      expect(colors).toContain('success');
      expect(colors).toContain('error');
      wrapper.unmount();
    });

    it('should capitalize stateDisplay for each resource', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];
      const runningResource = card.resources.find((r) => r.stateId === 'running');

      expect(runningResource?.stateDisplay).toStrictEqual('Running');
      wrapper.unmount();
    });

    it('should preserve counts from the summary response', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];
      const runningResource = card.resources.find((r) => r.stateId === 'running');
      const errorResource = card.resources.find((r) => r.stateId === 'error');

      expect(runningResource?.count).toStrictEqual(5);
      expect(errorResource?.count).toStrictEqual(2);
      wrapper.unmount();
    });
  });

  describe('byStateLayout', () => {
    it('should assign the success card as hero', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.byStateLayout.value.hero?.color).toStrictEqual('success');
      wrapper.unmount();
    });

    it('should place non-hero cards in the cards array', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const { cards } = result.byStateLayout.value;

      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((c) => c.color !== 'success')).toStrictEqual(true);
      wrapper.unmount();
    });

    it('should set subHero to null when there are fewer than 2 other cards', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.byStateLayout.value.subHero).toBeNull();
      wrapper.unmount();
    });
  });

  describe('byNamespaceCards', () => {
    it('should return cards grouped by namespace', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const cards = result.byNamespaceCards.value;

      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0].title).toStrictEqual('default');
      wrapper.unmount();
    });

    it('should have rows for each workload type present in the namespace', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const defaultCard = result.byNamespaceCards.value.find((c) => c.title === 'default');

      expect(defaultCard?.rows).toHaveLength(WORKLOAD_RESOURCE_TYPES.length);
      expect(defaultCard?.rows.map((r) => r.type)).toStrictEqual(WORKLOAD_RESOURCE_TYPES);
      wrapper.unmount();
    });

    it('should group counts by color within each row', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const defaultCard = result.byNamespaceCards.value.find((c) => c.title === 'default');
      const firstRow = defaultCard?.rows[0];
      const colors = firstRow?.counts.map((c) => c.color);

      expect(colors).toContain('error');
      expect(colors).toContain('success');
      wrapper.unmount();
    });

    it('should sort counts by color order (error first, success last)', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const defaultCard = result.byNamespaceCards.value.find((c) => c.title === 'default');
      const firstRow = defaultCard?.rows[0];
      const colors = firstRow?.counts.map((c) => c.color);

      expect(colors?.indexOf('error')).toBeLessThan(colors?.indexOf('success') as number);
      wrapper.unmount();
    });

    it('should sort namespaces alphabetically', async() => {
      const multiNsResponse = {
        summary: [{
          property: 'metadata.state.name',
          counts:   {
            running: {
              total:     3,
              namespace: { zebra: 1, alpha: 2 },
            },
          }
        }],
        data: [],
      };

      const { wrapper, result } = mountComposable({}, multiNsResponse);

      await flushPromises();

      const titles = result.byNamespaceCards.value.map((c) => c.title);

      expect(titles).toStrictEqual(['alpha', 'zebra']);
      wrapper.unmount();
    });

    it('should include stateNames in each count entry for routing', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const defaultCard = result.byNamespaceCards.value.find((c) => c.title === 'default');
      const firstRow = defaultCard?.rows[0];
      const successCount = firstRow?.counts.find((c) => c.color === 'success');

      expect(successCount?.stateNames).toContain('running');
      expect(successCount?.count).toStrictEqual(5);
      wrapper.unmount();
    });
  });

  describe('filterByNamespace', () => {
    it('should dispatch switchNamespaces with the namespace filter', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();

      result.filterByNamespace('cattle-system');

      expect(mockDispatch).toHaveBeenCalledWith('switchNamespaces', {
        ids: ['ns://cattle-system'],
        key: 'local',
      });
      wrapper.unmount();
    });
  });

  describe('navigateToNamespace', () => {
    it('should switch namespace filter and navigate to resource page', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();
      mockRouterPush.mockClear();

      result.navigateToNamespace('apps.deployment', 'cattle-system');

      expect(mockDispatch).toHaveBeenCalledWith('switchNamespaces', {
        ids: ['ns://cattle-system'],
        key: 'local',
      });
      expect(mockRouterPush).toHaveBeenCalledWith({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  'local',
          product:  'explorer',
          resource: 'apps.deployment',
        },
      });
      wrapper.unmount();
    });

    it('should include state filter query when stateNames are provided', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();
      mockRouterPush.mockClear();

      result.navigateToNamespace('apps.deployment', 'default', ['running', 'active']);

      expect(mockRouterPush).toHaveBeenCalledWith({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  'local',
          product:  'explorer',
          resource: 'apps.deployment',
        },
        query: { stateFilter: 'running,active' },
      });
      wrapper.unmount();
    });
  });

  describe('response validation', () => {
    // The composable caches malformed clusters in a module-level singleton, so each
    // invalid-data test uses a unique cluster id to stay independent of the others.
    function deploymentRouteFor(cluster: string) {
      return {
        name:   'c-cluster-product-resource',
        params: {
          cluster,
          product:  'explorer',
          resource: WORKLOAD_TYPES.DEPLOYMENT,
        },
      };
    }

    const malformedSummaryResponse = {
      summary: [{
        property: 'metadata.state.name',
        counts:   { running: { namespace: { default: 5 } } },
      }],
      data: [],
    };

    it('should redirect to the deployment page when a count entry is missing total', async() => {
      const { wrapper } = mountComposable({ clusterId: 'c-missing-total' }, malformedSummaryResponse);

      await flushPromises();

      expect(mockRouterPush).toHaveBeenCalledWith(deploymentRouteFor('c-missing-total'));
      wrapper.unmount();
    });

    it('should redirect when the summary is empty but data is present', async() => {
      const dataWithoutSummaryResponse = { summary: [], data: [{ id: 'pod-1' }] };

      const { wrapper } = mountComposable({ clusterId: 'c-empty-summary-with-data' }, dataWithoutSummaryResponse);

      await flushPromises();

      expect(mockRouterPush).toHaveBeenCalledWith(deploymentRouteFor('c-empty-summary-with-data'));
      wrapper.unmount();
    });

    it('should redirect when there is no summary but data is present', async() => {
      const dataWithoutSummaryResponse = { data: [{ id: 'pod-1' }] };

      const { wrapper } = mountComposable({ clusterId: 'c-no-summary-with-data' }, dataWithoutSummaryResponse);

      await flushPromises();

      expect(mockRouterPush).toHaveBeenCalledWith(deploymentRouteFor('c-no-summary-with-data'));
      wrapper.unmount();
    });

    it('should not redirect when every count entry has a total', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();

      expect(mockRouterPush).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('should not redirect when the summary is empty and there is no data', async() => {
      const emptyResponse = { summary: [], data: [] };

      const { wrapper } = mountComposable({}, emptyResponse);

      await flushPromises();

      expect(mockRouterPush).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('should not redirect when there is no summary and no data', async() => {
      const noSummaryResponse = { data: [] };

      const { wrapper } = mountComposable({}, noSummaryResponse);

      await flushPromises();

      expect(mockRouterPush).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('should not redirect for entries returned with an error', async() => {
      const errorResponse = { summary: null, error: 'No access' };

      const { wrapper } = mountComposable({}, errorResponse);

      await flushPromises();

      expect(mockRouterPush).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('should not redirect when the user has already navigated away from the dashboard', async() => {
      // The fetch resolves after the user left the workload dashboard.
      mockCurrentRoute.value.name = 'c-cluster-product-resource';

      const { wrapper } = mountComposable({ clusterId: 'c-navigated-away' }, malformedSummaryResponse);

      await flushPromises();

      expect(mockRouterPush).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('should skip fetching and redirect immediately for a cluster already known to be invalid', async() => {
      const cluster = 'c-cached-invalid';

      // First mount detects the malformed response and caches the cluster.
      const first = mountComposable({ clusterId: cluster }, malformedSummaryResponse);

      await flushPromises();
      first.wrapper.unmount();

      jest.clearAllMocks();

      // Second mount returns a valid response, but the cache should short-circuit the
      // fetch entirely and redirect without ever requesting the summaries again.
      const second = mountComposable({ clusterId: cluster }, summaryResponse);

      await flushPromises();

      expect(mockDispatch).not.toHaveBeenCalledWith('cluster/request', expect.anything());
      expect(mockRouterPush).toHaveBeenCalledWith(deploymentRouteFor(cluster));
      second.wrapper.unmount();
    });
  });
});
