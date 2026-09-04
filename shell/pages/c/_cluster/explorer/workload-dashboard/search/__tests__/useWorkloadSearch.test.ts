import { useWorkloadSearch } from '@shell/pages/c/_cluster/explorer/workload-dashboard/search/useWorkloadSearch';
import { WORKLOAD_RESOURCE_TYPES } from '@shell/pages/c/_cluster/explorer/workload-dashboard/types';
import { WORKLOAD_SEARCH_DEBOUNCE_MS } from '@shell/pages/c/_cluster/explorer/workload-dashboard/search/types';
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
    metadata:       { name, namespace },
    detailLocation: { name: 'detail', params: { id: name, namespace } },
  };
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

    expect(mockDispatch).toHaveBeenCalledTimes(WORKLOAD_RESOURCE_TYPES.length);

    WORKLOAD_RESOURCE_TYPES.forEach((type) => {
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findPage', expect.objectContaining({
        type,
        opt: expect.objectContaining({
          transient:  true,
          watch:      false,
          pagination: expect.objectContaining({
            page:     1,
            pageSize: 10,
            sort:     [{ field: 'metadata.name', asc: true }],
          }),
        }),
      }));
    });
  });

  it('skips types the user cannot list', async() => {
    mockDispatch.mockResolvedValue({ data: [] });
    setupGetters({ 'cluster/canList': (type: string) => type !== WORKLOAD_RESOURCE_TYPES[0] });
    const { result } = mountComposable();

    result.onSearch('nginx');
    jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS);
    await flushPromises();

    expect(mockDispatch).toHaveBeenCalledTimes(WORKLOAD_RESOURCE_TYPES.length - 1);
  });

  it('groups returned resources under a type header option', async() => {
    mockDispatch.mockImplementation((action: string, { type }: { type: string }) => {
      if (type === WORKLOAD_RESOURCE_TYPES[0]) {
        return Promise.resolve({ data: [makeResource('nginx-a'), makeResource('nginx-b', 'kube-system')] });
      }

      return Promise.resolve({ data: [] });
    });
    const { result } = mountComposable();

    result.onSearch('nginx');
    jest.advanceTimersByTime(WORKLOAD_SEARCH_DEBOUNCE_MS);
    await flushPromises();

    expect(result.options.value).toStrictEqual([
      {
        kind:     'group',
        label:    expect.any(String),
        uniqueId: `group-${ WORKLOAD_RESOURCE_TYPES[0] }`,
      },
      {
        label:     'nginx-a',
        namespace: 'default',
        uniqueId:  `${ WORKLOAD_RESOURCE_TYPES[0] }/default/nginx-a`,
        value:     { name: 'detail', params: { id: 'nginx-a', namespace: 'default' } },
      },
      {
        label:     'nginx-b',
        namespace: 'kube-system',
        uniqueId:  `${ WORKLOAD_RESOURCE_TYPES[0] }/kube-system/nginx-b`,
        value:     { name: 'detail', params: { id: 'nginx-b', namespace: 'kube-system' } },
      },
    ]);
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
