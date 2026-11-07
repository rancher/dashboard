import { useWorkloadDashboard } from '@shell/pages/c/_cluster/explorer/workload-dashboard/composable';
import { WORKLOAD_DASHBOARD_RESOURCE_TYPES } from '@shell/pages/c/_cluster/explorer/workload-dashboard/types';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
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

// Every accessible type returns `summaryResponse` (5 running + 2 error), so the
// total workload count scales with the number of workload dashboard resource types.
const TOTAL_WORKLOAD_COUNT = WORKLOAD_DASHBOARD_RESOURCE_TYPES.length * 7;

const ERROR_FILTER = 'filter=metadata.state.error=true';
const TRANSITIONING_FILTER = 'filter=metadata.state.error=false&filter=metadata.state.transitioning=true';

interface ExtraResponses {
  error?: any;
  transitioning?: any;
  sample?: any;
}

function mountComposable(getterOverrides: Record<string, any> = {}, dispatchResponse: any = summaryResponse, extraResponses: ExtraResponses = {}) {
  setupGetters({
    'cluster/schemaFor': () => ({ links: { collection: '/v1/test' } }),
    'cluster/urlFor':    (type: string) => `/v1/${ type }?`,
    'cluster/canList':   () => true,
    ...getterOverrides,
  });

  mockDispatch.mockImplementation((action: string, { url = '' }: { url?: string } = {}) => {
    if (action !== 'cluster/request') {
      return Promise.resolve();
    }

    let response = dispatchResponse;

    if (url.includes(ERROR_FILTER)) {
      response = extraResponses.error ?? { data: [] };
    } else if (url.includes(TRANSITIONING_FILTER)) {
      response = extraResponses.transitioning ?? { data: [] };
    } else if (!url.includes('summary=')) {
      response = extraResponses.sample ?? dispatchResponse;
    }

    return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
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
      const { wrapper, result } = mountComposable({ isAllNamespaces: true });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual(`%workloadDashboard.subtitle.allNamespaces% %workloadDashboard.workloadCount%{"count":${ TOTAL_WORKLOAD_COUNT }}`);
      wrapper.unmount();
    });

    it('should return userNamespaces subtitle with workloadCount suffix for ALL_USER filter', async() => {
      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceFilters: ['all://user'],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual(`%workloadDashboard.subtitle.userNamespaces% %workloadDashboard.workloadCount%{"count":${ TOTAL_WORKLOAD_COUNT }}`);
      wrapper.unmount();
    });

    it('should return systemNamespaces subtitle with workloadCount suffix for ALL_SYSTEM filter', async() => {
      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceFilters: ['all://system'],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual(`%workloadDashboard.subtitle.systemNamespaces% %workloadDashboard.workloadCount%{"count":${ TOTAL_WORKLOAD_COUNT }}`);
      wrapper.unmount();
    });

    it('should return project subtitle with workloadCount suffix for project filter', async() => {
      const projectId = 'p-12345';

      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceFilters: [`project://${ projectId }`],
        'management/all': () => [{
          id: `local/${ projectId }`, nameDisplay: 'My Project', metadata: { name: projectId }
        }],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual(`%workloadDashboard.subtitle.project%{"name":"My Project"} %workloadDashboard.workloadCount%{"count":${ TOTAL_WORKLOAD_COUNT }}`);
      wrapper.unmount();
    });

    it('should return namespace subtitle with workloadCount suffix for namespace filter', async() => {
      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceFilters: ['ns://cattle-system'],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual(`%workloadDashboard.subtitle.namespace%{"name":"cattle-system"} %workloadDashboard.workloadCount%{"count":${ TOTAL_WORKLOAD_COUNT }}`);
      wrapper.unmount();
    });

    it('should return multipleSelected subtitle with workloadCount suffix for multiple filters', async() => {
      const { wrapper, result } = mountComposable({
        isAllNamespaces:  false,
        namespaceFilters: ['ns://default', 'ns://kube-system'],
      });

      await flushPromises();

      expect(result.namespaceSubtitle.value).toStrictEqual(`%workloadDashboard.subtitle.multipleSelected%{"selected":2} %workloadDashboard.workloadCount%{"count":${ TOTAL_WORKLOAD_COUNT }}`);
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

    it('should include name filter query when nameFilter is provided', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      const route = result.resourceRoute('apps.deployment', undefined, 'nginx');

      expect((route as any).query).toStrictEqual({ nameFilter: 'nginx' });
      wrapper.unmount();
    });

    it('should include both state and name filter queries when both are provided', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      const route = result.resourceRoute('apps.deployment', ['running'], 'nginx');

      expect((route as any).query).toStrictEqual({ stateFilter: 'running', nameFilter: 'nginx' });
      wrapper.unmount();
    });

    it('should not include query for an empty nameFilter', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      const route = result.resourceRoute('apps.deployment', undefined, '');

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

      expect(result.byTypeCards.value).toHaveLength(WORKLOAD_DASHBOARD_RESOURCE_TYPES.length);
      wrapper.unmount();
    });

    it('should key each card by its workload type', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];

      expect(card.key).toStrictEqual(WORKLOAD_DASHBOARD_RESOURCE_TYPES[0]);
      wrapper.unmount();
    });

    it('should include a title on each card', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];

      expect(card.title).toBeTruthy();
      wrapper.unmount();
    });

    it('should link the card to the unfiltered resource list', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];

      expect(card.to).toStrictEqual(result.resourceRoute(WORKLOAD_DASHBOARD_RESOURCE_TYPES[0]));
      wrapper.unmount();
    });

    it('should total the counts from the summary response', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];

      expect(card.total).toStrictEqual(7);
      wrapper.unmount();
    });

    it('should build one row per state, most critical first, with capitalized labels and counts', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];

      expect(card.rows.map(({ label, color, count }) => ({
        label, color, count
      }))).toStrictEqual([
        {
          label: 'Error', color: 'error', count: 2
        },
        {
          label: 'Running', color: 'success', count: 5
        },
      ]);
      wrapper.unmount();
    });

    it('should link each row to the resource list filtered to its state', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const type = WORKLOAD_DASHBOARD_RESOURCE_TYPES[0];
      const card = result.byTypeCards.value[0];

      expect(card.rows.map((r) => r.to)).toStrictEqual([
        result.resourceRoute(type, ['error']),
        result.resourceRoute(type, ['running']),
      ]);
      wrapper.unmount();
    });

    it('should build one bar segment per color as a percentage of the total', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const card = result.byTypeCards.value[0];

      expect(card.segments).toStrictEqual([
        { color: 'error', percent: (2 / 7) * 100 },
        { color: 'success', percent: (5 / 7) * 100 },
      ]);
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

      expect(defaultCard?.rows).toHaveLength(WORKLOAD_DASHBOARD_RESOURCE_TYPES.length);
      expect(defaultCard?.rows.map((r) => r.key)).toStrictEqual(WORKLOAD_DASHBOARD_RESOURCE_TYPES);
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

    it('should link each count to the resource list filtered to the states of its color', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const defaultCard = result.byNamespaceCards.value.find((c) => c.title === 'default');
      const firstRow = defaultCard?.rows[0];
      const successCount = firstRow?.counts.find((c) => c.color === 'success');

      expect(successCount).toStrictEqual({
        color: 'success', count: 5, to: result.resourceRoute(WORKLOAD_DASHBOARD_RESOURCE_TYPES[0], ['running'])
      });
      wrapper.unmount();
    });

    it('should link each row to the unfiltered resource list', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const defaultCard = result.byNamespaceCards.value.find((c) => c.title === 'default');

      expect(defaultCard?.rows[0].to).toStrictEqual(result.resourceRoute(WORKLOAD_DASHBOARD_RESOURCE_TYPES[0]));
      wrapper.unmount();
    });

    it('should key each card by its namespace and make it selectable', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      const defaultCard = result.byNamespaceCards.value.find((c) => c.title === 'default');

      expect([defaultCard?.key, defaultCard?.selectable]).toStrictEqual(['default', true]);
      wrapper.unmount();
    });
  });

  describe('state flags', () => {
    function stateResponse(counts: Record<string, { total: number; namespace: Record<string, number> }>) {
      return { summary: [{ property: 'metadata.state.name', counts }], data: [] };
    }

    const runningResponse = stateResponse({ running: { total: 4, namespace: { default: 3, other: 1 } } });
    const oneRunningFlaggedResponse = stateResponse({ running: { total: 1, namespace: { other: 1 } } });

    const podsOnly = { 'cluster/canList': (type: string) => type === POD };

    function podRows(result: ReturnType<typeof useWorkloadDashboard>) {
      return result.byTypeCards.value.find((c) => c.key === POD)?.rows.map(({
        key, label, color, count
      }) => ({
        key, label, color, count
      }));
    }

    afterEach(() => {
      jest.useRealTimers();
    });

    it.each([
      ['in error', 'error', { error: oneRunningFlaggedResponse }],
      ['transitioning', 'info', { transitioning: oneRunningFlaggedResponse }],
    ])('should count the resources of a state that are %s as %s and the rest by the state name', async(_, color, extraResponses) => {
      const { wrapper, result } = mountComposable(podsOnly, runningResponse, extraResponses);

      await flushPromises();

      expect(podRows(result)).toStrictEqual([
        {
          key: `running:${ color }`, label: 'Running', color, count: 1
        },
        {
          key: 'running:success', label: 'Running', color: 'success', count: 3
        },
      ]);
      wrapper.unmount();
    });

    it.each([
      ['pending', 'Pending', 'info', 3, 'transitioning'],
      ['error', 'Error', 'error', 2, 'error'],
    ])('should count the flagged %s resources in one row when the state name has the flag color', async(state, label, color, total, flag) => {
      const response = stateResponse({ [state]: { total, namespace: { default: total } } });
      const flaggedResponse = stateResponse({ [state]: { total: 1, namespace: { default: 1 } } });
      const { wrapper, result } = mountComposable(podsOnly, response, { [flag]: flaggedResponse });

      await flushPromises();

      expect(podRows(result)).toStrictEqual([{
        key: `${ state }:${ color }`, label, color, count: total
      }]);
      wrapper.unmount();
    });

    it('should list a split state first among the rows of each color', async() => {
      const response = stateResponse({
        completed: { total: 1, namespace: { default: 1 } },
        running:   { total: 4, namespace: { default: 4 } },
      });
      const { wrapper, result } = mountComposable(podsOnly, response, { transitioning: stateResponse({ running: { total: 1, namespace: { default: 1 } } }) });

      await flushPromises();

      expect(podRows(result)?.map(({ label, color }) => [label, color])).toStrictEqual([['Running', 'info'], ['Running', 'success'], ['Completed', 'success']]);
      wrapper.unmount();
    });

    it('should not count more flagged resources than the summary has in a namespace', async() => {
      const flaggedResponse = stateResponse({ running: { total: 3, namespace: { other: 2, gone: 1 } } });
      const { wrapper, result } = mountComposable(podsOnly, runningResponse, { transitioning: flaggedResponse });

      await flushPromises();

      expect(podRows(result)?.map(({ color, count }) => [color, count])).toStrictEqual([['info', 1], ['success', 3]]);
      wrapper.unmount();
    });

    it('should put only the transitioning resources in the info state card', async() => {
      const { wrapper, result } = mountComposable(podsOnly, runningResponse, { transitioning: oneRunningFlaggedResponse });

      await flushPromises();

      const { hero, cards } = result.byStateLayout.value;

      expect([hero, ...cards].map((card) => [card?.color, card?.rows.map((row) => row.counts[0].count)])).toStrictEqual([['success', [3]], ['info', [1]]]);
      wrapper.unmount();
    });

    it('should count the transitioning resources by namespace', async() => {
      const { wrapper, result } = mountComposable(podsOnly, runningResponse, { transitioning: oneRunningFlaggedResponse });

      await flushPromises();

      const countsIn = (ns: string) => result.byNamespaceCards.value.find((c) => c.key === ns)?.rows[0].counts.map(({ color, count }) => ({ color, count }));

      expect([countsIn('default'), countsIn('other')]).toStrictEqual([
        [{ color: 'success', count: 3 }],
        [{ color: 'info', count: 1 }],
      ]);
      wrapper.unmount();
    });

    it('should request the flagged counts only for types that can be filtered by state flags', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();

      const flaggedUrls = mockDispatch.mock.calls.map(([, opts]) => opts?.url).filter((url) => url?.includes('filter=metadata.state'));

      expect(flaggedUrls).toStrictEqual([
        `/v1/${ WORKLOAD_TYPES.JOB }?&${ ERROR_FILTER }&summary=metadata.state.name&summaryonly&summarynamespaced`,
        `/v1/${ WORKLOAD_TYPES.JOB }?&${ TRANSITIONING_FILTER }&summary=metadata.state.name&summaryonly&summarynamespaced`,
        `/v1/${ POD }?&${ ERROR_FILTER }&summary=metadata.state.name&summaryonly&summarynamespaced`,
        `/v1/${ POD }?&${ TRANSITIONING_FILTER }&summary=metadata.state.name&summaryonly&summarynamespaced`,
      ]);
      wrapper.unmount();
    });

    describe('when the flagged counts cannot be fetched', () => {
      const invalidResponse = { summary: [{ property: 'metadata.state.name', counts: { running: { namespace: {} } } }], data: [] };

      it.each([
        ['the request fails', 'containercreating', 'Containercreating', new Error('column is invalid')],
        ['the response is invalid', 'terminating', 'Terminating', invalidResponse],
      ])('should color every resource of a state with the sampled state color when %s', async(_, state, label, transitioning) => {
        const sample = {
          data: [{
            metadata: {
              state: {
                name: state, error: false, transitioning: true
              }
            }
          }]
        };
        const response = stateResponse({ [state]: { total: 2, namespace: { default: 2 } } });
        const { wrapper, result } = mountComposable(podsOnly, response, { transitioning, sample });

        await flushPromises();

        expect(podRows(result)).toStrictEqual([{
          key: `${ state }:info`, label, color: 'info', count: 2
        }]);
        wrapper.unmount();
      });

      it('should not redirect to the deployment list', async() => {
        const { wrapper } = mountComposable(podsOnly, runningResponse, { transitioning: new Error('column is invalid') });

        await flushPromises();

        expect(mockRouterPush).not.toHaveBeenCalled();
        wrapper.unmount();
      });
    });

    it('should recount the states on the next poll', async() => {
      jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });

      const extraResponses: ExtraResponses = { transitioning: oneRunningFlaggedResponse };
      const { wrapper, result } = mountComposable(podsOnly, runningResponse, extraResponses);
      const colorCounts = () => podRows(result)?.map(({ color, count }) => [color, count]);

      await flushPromises();
      const before = colorCounts();

      delete extraResponses.transitioning;
      jest.advanceTimersByTime(5000);
      await flushPromises();

      expect([before, colorCounts()]).toStrictEqual([[['info', 1], ['success', 3]], [['success', 4]]]);
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
    it('should dispatch switchNamespaces with the namespace filter', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();

      result.navigateToNamespace('apps.deployment', 'cattle-system');

      expect(mockDispatch).toHaveBeenCalledWith('switchNamespaces', {
        ids: ['ns://cattle-system'],
        key: 'local',
      });
      wrapper.unmount();
    });

    it('should navigate to the resource list for the type', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();
      mockRouterPush.mockClear();

      result.navigateToNamespace('apps.deployment', 'cattle-system');

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
