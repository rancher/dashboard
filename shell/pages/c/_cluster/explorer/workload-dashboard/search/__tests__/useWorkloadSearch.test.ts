import { useWorkloadSearch } from '@shell/pages/c/_cluster/explorer/workload-dashboard/search/useWorkloadSearch';
import { WORKLOAD_DASHBOARD_RESOURCE_TYPES } from '@shell/pages/c/_cluster/explorer/workload-dashboard/types';
import { WORKLOAD_SEARCH_DEBOUNCE_MS, WORKLOAD_SEARCH_RESULTS_PER_TYPE } from '@shell/pages/c/_cluster/explorer/workload-dashboard/search/types';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { defineComponent, h } from 'vue';
import { shallowMount, flushPromises } from '@vue/test-utils';

const mockGetters: Record<string, any> = {};
const mockDispatch = jest.fn();
const mockRouterPush = jest.fn();

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

jest.mock('vue-router', () => ({ useRouter: () => ({ push: mockRouterPush }) }));

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string, args?: Record<string, any>) => `%${ key }%${ args ? JSON.stringify(args) : '' }` }) }));

jest.mock('@shell/plugins/steve/steve-pagination-utils', () => ({
  __esModule: true,
  default:    { createParamsFromNsFilter: jest.fn(() => ({ projectsOrNamespaces: [], filters: [] })) },
}));

const defaultGetters: Record<string, any> = {
  'cluster/schemaFor': () => ({ id: 'test' }),
  'cluster/canList':   () => true,
  namespaceFilters:    [],
  'cluster/all':       () => [],
  isAllNamespaces:     true,
  currentCluster:      { isLocal: true },
  'prefs/get':         () => ({}),
  currentProduct:      { hideSystemResources: false },
};

function setupGetters(overrides: Record<string, any> = {}) {
  Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
  Object.assign(mockGetters, defaultGetters, overrides);
}

function mountComposable() {
  let result: ReturnType<typeof useWorkloadSearch>;

  const wrapper = shallowMount(defineComponent({
    setup() {
      result = useWorkloadSearch();

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

function makeResource(name: string, namespace = 'default') {
  return {
    metadata:         { name, namespace },
    detailLocation:   { name: 'detail', params: { id: name, namespace } },
    stateSimpleColor: 'success',
  };
}

const FIRST_TYPE = WORKLOAD_DASHBOARD_RESOURCE_TYPES[0];

// Returns `response` for the first workload type and no results for the rest.
function mockFirstTypeResponse(response: any) {
  mockDispatch.mockImplementation((action: string, { type }: { type: string }) => {
    return Promise.resolve(type === FIRST_TYPE ? response : { data: [] });
  });
}

async function search(result: ReturnType<typeof useWorkloadSearch>, term: string) {
  result.onSearch(term);
  jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS);
  await flushPromises();
}

describe('composable: useWorkloadSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setupGetters();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not dispatch a request until the debounce time has elapsed', () => {
    mockDispatch.mockResolvedValue({ data: [] });
    const { result } = mountComposable();

    result.onSearch('nginx');
    expect(mockDispatch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS - 1);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('dispatches cluster/findPage as a transient, non-watched request for every accessible workload type once debounced', async() => {
    mockDispatch.mockResolvedValue({ data: [] });
    const { result } = mountComposable();

    result.onSearch('nginx');
    jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS);
    await flushPromises();

    expect(mockDispatch).toHaveBeenCalledTimes(WORKLOAD_DASHBOARD_RESOURCE_TYPES.length);

    WORKLOAD_DASHBOARD_RESOURCE_TYPES.forEach((type) => {
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findPage', expect.objectContaining({
        type,
        opt: expect.objectContaining({
          transient:  true,
          watch:      false,
          pagination: expect.objectContaining({
            page:     1,
            pageSize: WORKLOAD_SEARCH_RESULTS_PER_TYPE,
            sort:     [],
          }),
        }),
      }));
    });
  });

  it('filters each request by a partial match on the resource name', async() => {
    mockDispatch.mockResolvedValue({ data: [] });
    const { result } = mountComposable();

    await search(result, 'nginx');

    const { filters } = mockDispatch.mock.calls[0][1].opt.pagination;

    expect(filters).toStrictEqual([
      PaginationParamFilter.createSingleField({
        field: 'metadata.name',
        value: 'nginx',
        exact: false,
      }),
    ]);
  });

  it('scopes each request to the header namespace filter', async() => {
    const nsFilter = PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: 'default' });

    (stevePaginationUtils.createParamsFromNsFilter as jest.Mock).mockReturnValueOnce({
      projectsOrNamespaces: [{ projectOrNamespace: 'p-1' }],
      filters:              [nsFilter],
    });
    mockDispatch.mockResolvedValue({ data: [] });
    const { result } = mountComposable();

    await search(result, 'nginx');

    const { pagination } = mockDispatch.mock.calls[0][1].opt;

    expect(pagination.projectsOrNamespaces).toStrictEqual([{ projectOrNamespace: 'p-1' }]);
    expect(pagination.filters[0]).toStrictEqual(nsFilter);
  });

  it('skips types without a schema', async() => {
    mockDispatch.mockResolvedValue({ data: [] });
    setupGetters({ 'cluster/schemaFor': (type: string) => (type === FIRST_TYPE ? null : { id: type }) });
    const { result } = mountComposable();

    await search(result, 'nginx');

    expect(mockDispatch).toHaveBeenCalledTimes(WORKLOAD_DASHBOARD_RESOURCE_TYPES.length - 1);
  });

  it('skips types the user cannot list', async() => {
    mockDispatch.mockResolvedValue({ data: [] });
    setupGetters({ 'cluster/canList': (type: string) => type !== WORKLOAD_DASHBOARD_RESOURCE_TYPES[0] });
    const { result } = mountComposable();

    result.onSearch('nginx');
    jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS);
    await flushPromises();

    expect(mockDispatch).toHaveBeenCalledTimes(WORKLOAD_DASHBOARD_RESOURCE_TYPES.length - 1);
  });

  it('groups returned resources under a type header option', async() => {
    const resourceA = makeResource('nginx-a');
    const resourceB = makeResource('nginx-b', 'kube-system');

    mockFirstTypeResponse({ data: [resourceA, resourceB] });
    const { result } = mountComposable();

    await search(result, 'nginx');

    expect(result.options.value).toStrictEqual([
      {
        kind:     'group',
        label:    expect.any(String),
        uniqueId: `group-${ FIRST_TYPE }`,
      },
      {
        label:     'nginx-a',
        namespace: 'default',
        uniqueId:  `${ FIRST_TYPE }/default/nginx-a`,
        value:     { name: 'detail', params: { id: 'nginx-a', namespace: 'default' } },
        color:     'success',
        resource:  resourceA,
      },
      {
        label:     'nginx-b',
        namespace: 'kube-system',
        uniqueId:  `${ FIRST_TYPE }/kube-system/nginx-b`,
        value:     { name: 'detail', params: { id: 'nginx-b', namespace: 'kube-system' } },
        color:     'success',
        resource:  resourceB,
      },
    ]);
  });

  it('labels the group header with the type and the total match count', async() => {
    mockFirstTypeResponse({ data: [makeResource('nginx-a')], pagination: { result: { count: 12 } } });
    const { result } = mountComposable();

    await search(result, 'nginx');

    expect(result.options.value[0].label).toStrictEqual(`%typeLabel."${ FIRST_TYPE }"%{"count":2} (12)`);
  });

  it('falls back to the number of returned resources when no total count is returned', async() => {
    mockFirstTypeResponse({ data: [makeResource('nginx-a'), makeResource('nginx-b')] });
    const { result } = mountComposable();

    await search(result, 'nginx');

    expect(result.options.value[0].label).toStrictEqual(`%typeLabel."${ FIRST_TYPE }"%{"count":2} (2)`);
  });

  it('appends a "more" option when the total count exceeds the returned resources', async() => {
    mockFirstTypeResponse({ data: [makeResource('nginx-a'), makeResource('nginx-b')], pagination: { result: { count: 5 } } });
    const { result } = mountComposable();

    await search(result, 'nginx');

    const typeLabel = `%typeLabel."${ FIRST_TYPE }"%{"count":2}`;

    expect(result.options.value[result.options.value.length - 1]).toStrictEqual({
      kind:         'more',
      label:        `%workloadDashboard.search.moreResults%${ JSON.stringify({ count: 3, type: typeLabel.toLowerCase() }) }`,
      uniqueId:     `more-${ FIRST_TYPE }`,
      resourceType: FIRST_TYPE,
      searchTerm:   'nginx',
    });
  });

  it('does not append a "more" option when all matches were returned', async() => {
    mockFirstTypeResponse({ data: [makeResource('nginx-a')], pagination: { result: { count: 1 } } });
    const { result } = mountComposable();

    await search(result, 'nginx');

    expect(result.options.value.some((option) => option.kind === 'more')).toBe(false);
  });

  it('omits a type whose request fails and keeps the results of the others', async() => {
    const [failingType, okType] = WORKLOAD_DASHBOARD_RESOURCE_TYPES;

    mockDispatch.mockImplementation((action: string, { type }: { type: string }) => {
      if (type === failingType) {
        return Promise.reject(new Error('boom'));
      }

      return Promise.resolve(type === okType ? { data: [makeResource('nginx-a')] } : { data: [] });
    });
    const { result } = mountComposable();

    await search(result, 'nginx');

    expect(result.options.value.map((option) => option.uniqueId)).toStrictEqual([
      `group-${ okType }`,
      `${ okType }/default/nginx-a`,
    ]);
  });

  it('ignores a response for a search that has since been superseded by a newer search', async() => {
    const resolvers: ((value: any) => void)[] = [];

    mockDispatch.mockImplementation((action: string, { type }: { type: string }) => {
      if (type !== FIRST_TYPE) {
        return Promise.resolve({ data: [] });
      }

      return new Promise((resolve) => resolvers.push(resolve));
    });
    const { result } = mountComposable();

    await search(result, 'ng');
    await search(result, 'nginx');

    resolvers[1]({ data: [makeResource('nginx-new')] });
    await flushPromises();
    resolvers[0]({ data: [makeResource('ng-old')] });
    await flushPromises();

    expect(result.options.value[1].label).toStrictEqual('nginx-new');
  });

  it('ignores a response whose term no longer matches the search term still waiting on the debounce', async() => {
    let resolveFirst: (value: any) => void = () => {};

    mockDispatch.mockImplementation((action: string, { type }: { type: string }) => {
      if (type !== FIRST_TYPE) {
        return Promise.resolve({ data: [] });
      }

      return new Promise((resolve) => {
        resolveFirst = resolve;
      });
    });
    const { result } = mountComposable();

    await search(result, 'ng');
    result.onSearch('nginx');

    resolveFirst({ data: [makeResource('ng-old')] });
    await flushPromises();

    expect(result.options.value).toStrictEqual([]);
  });

  it('keeps loading set while a newer search term is still waiting on the debounce', async() => {
    let resolveFirst: (value: any) => void = () => {};

    mockDispatch.mockImplementation((action: string, { type }: { type: string }) => {
      if (type !== FIRST_TYPE) {
        return Promise.resolve({ data: [] });
      }

      return new Promise((resolve) => {
        resolveFirst = resolve;
      });
    });
    const { result } = mountComposable();

    await search(result, 'ng');
    result.onSearch('nginx');

    resolveFirst({ data: [] });
    await flushPromises();

    expect(result.loading.value).toBe(true);
  });

  it('stores the latest search term', () => {
    const { result } = mountComposable();

    result.onSearch('nginx');

    expect(result.searchTerm.value).toStrictEqual('nginx');
  });

  it('sets loading while requests are in flight and clears it once resolved', async() => {
    let resolveDispatch: (value: any) => void = () => {};

    mockDispatch.mockReturnValue(new Promise((resolve) => {
      resolveDispatch = resolve;
    }));
    const { result } = mountComposable();

    result.onSearch('nginx');
    jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS);
    await flushPromises();

    expect(result.loading.value).toBe(true);

    resolveDispatch({ data: [] });
    await flushPromises();

    expect(result.loading.value).toBe(false);
  });

  it('clears options immediately without dispatching when the search term is emptied', async() => {
    mockDispatch.mockResolvedValue({ data: [makeResource('nginx-a')] });
    const { result } = mountComposable();

    result.onSearch('nginx');
    jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS);
    await flushPromises();
    expect(result.options.value.length).toBeGreaterThan(0);

    mockDispatch.mockClear();
    result.onSearch('');

    expect(result.options.value).toStrictEqual([]);
    expect(result.loading.value).toBe(false);

    jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS);
    await flushPromises();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('navigates to the selected option route', () => {
    const { result } = mountComposable();
    const route = { name: 'detail', params: { id: 'nginx-a' } };

    result.onSelect(route);

    expect(mockRouterPush).toHaveBeenCalledWith(route);
  });

  it('does not navigate when no route is provided', () => {
    const { result } = mountComposable();

    result.onSelect(undefined);

    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
