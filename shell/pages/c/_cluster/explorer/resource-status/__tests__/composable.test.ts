import { defineComponent, h, reactive, ref } from 'vue';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { useClusterResourceStatus } from '@shell/pages/c/_cluster/explorer/resource-status/composable';
import { COUNT, NODE, WORKLOAD_TYPES } from '@shell/config/types';

const DEPLOYMENT = WORKLOAD_TYPES.DEPLOYMENT;

const mockGetters: Record<string, any> = reactive({});
const mockDispatch = jest.fn();
const mockResolveStateColors = jest.fn();
const mockNamespaceFilterParam = ref('');
const mockColors: Record<string, string> = {
  active:           'success',
  running:          'success',
  error:            'error',
  crashloopbackoff: 'error',
  degraded:         'warning',
  'in-progress':    'info',
  updating:         'info',
};

jest.mock('vuex', () => ({ useStore: () => ({ getters: mockGetters, dispatch: mockDispatch }) }));

jest.mock('lodash/debounce', () => (fn: () => void) => Object.assign(() => fn(), { cancel: jest.fn() }));

jest.mock('@shell/composables/useNamespaceFilterParam', () => ({ useNamespaceFilterParam: () => mockNamespaceFilterParam }));

jest.mock('@shell/composables/useStateColor', () => ({
  useStateColor: () => ({
    toStateColor:       (state: string) => mockColors[state] || 'success',
    resolveStateColors: mockResolveStateColors,
  }),
}));

const schemas: Record<string, any> = {
  [DEPLOYMENT]:     { id: DEPLOYMENT, attributes: { namespaced: true } },
  [NODE]:           { id: NODE, attributes: { namespaced: false } },
  pod:              { id: 'pod', attributes: { namespaced: true } },
  'batch.job':      { id: 'batch.job', attributes: { namespaced: true } },
  'apps.daemonset': { id: 'apps.daemonset', attributes: { namespaced: true } },
  persistentvolume: { id: 'persistentvolume', attributes: { namespaced: false } },
};

const labels: Record<string, string> = {
  [DEPLOYMENT]:     'Deployments',
  [NODE]:           'Nodes',
  pod:              'Pods',
  'batch.job':      'Jobs',
  persistentvolume: 'PersistentVolumes',
};

function countEntry(states: Record<string, number> = {}, count = 1) {
  return { summary: { count, states } };
}

function summaryResponse(counts: Record<string, number>) {
  return {
    summary: [{
      property: 'metadata.state.name',
      counts:   Object.fromEntries(Object.entries(counts).map(([state, total]) => [state, { total, namespace: {} }])),
    }],
  };
}

const defaultCounts = {
  [DEPLOYMENT]:     countEntry(),
  [NODE]:           countEntry(),
  pod:              countEntry({ error: 2 }),
  'batch.job':      countEntry({ 'in-progress': 1 }),
  'apps.daemonset': countEntry(),
  persistentvolume: countEntry(),
};

const defaultResponses: Record<string, any> = {
  [DEPLOYMENT]: summaryResponse({ active: 3, error: 1 }),
  [NODE]:       summaryResponse({ active: 2 }),
  pod:          summaryResponse({
    running: 5, crashloopbackoff: 2, error: 1, degraded: 1
  }),
  'batch.job': summaryResponse({ updating: 1 }),
};

let responses: Record<string, any> = {};
let counts: Record<string, any> = {};

function setupGetters(overrides: Record<string, any> = {}) {
  Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
  Object.assign(mockGetters, {
    clusterId:            'c-123',
    namespaceFilters:     [],
    'cluster/all':        (type: string) => (type === COUNT ? [{ counts }] : []),
    'cluster/schemaFor':  (type: string) => schemas[type],
    'cluster/canList':    (type: string) => !!schemas[type],
    'cluster/urlFor':     (type: string) => `/v1/${ type }?exclude=metadata.managedFields`,
    'type-map/isIgnored': () => false,
    'type-map/labelFor':  (schema: { id: string }) => labels[schema.id],
    ...overrides,
  });
}

function requestedUrls(): string[] {
  return mockDispatch.mock.calls.filter(([action]) => action === 'cluster/request').map(([, { url }]) => url);
}

function mountComposable(getterOverrides: Record<string, any> = {}) {
  setupGetters(getterOverrides);

  let result: ReturnType<typeof useClusterResourceStatus>;

  const wrapper = shallowMount(defineComponent({
    setup() {
      result = useClusterResourceStatus();

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

function route(resource: string, stateFilter?: string) {
  return {
    name:   'c-cluster-product-resource',
    params: {
      cluster: 'c-123', product: 'explorer', resource
    },
    ...(stateFilter ? { query: { stateFilter } } : {}),
  };
}

describe('composable: useClusterResourceStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNamespaceFilterParam.value = '';
    counts = { ...defaultCounts };
    responses = { ...defaultResponses };

    mockDispatch.mockImplementation((action: string, { url }: { url: string }) => {
      const type = url.replace('/v1/', '').split('?')[0];

      return responses[type] instanceof Error ? Promise.reject(responses[type]) : Promise.resolve(responses[type] || summaryResponse({}));
    });
  });

  describe('fetching', () => {
    it('should not be loaded before the first response', () => {
      const { wrapper, result } = mountComposable();

      expect(result.loaded.value).toStrictEqual(false);
      wrapper.unmount();
    });

    it('should be loaded after the first response', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.loaded.value).toStrictEqual(true);
      wrapper.unmount();
    });

    it('should fetch deployments, nodes and the listable, visible workload types with problems', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();

      expect(requestedUrls()).toStrictEqual([
        `/v1/${ DEPLOYMENT }?exclude=metadata.managedFields&summary=metadata.state.name&summaryonly`,
        `/v1/${ NODE }?exclude=metadata.managedFields&summary=metadata.state.name&summaryonly`,
        '/v1/batch.job?exclude=metadata.managedFields&summary=metadata.state.name&summaryonly',
        '/v1/pod?exclude=metadata.managedFields&summary=metadata.state.name&summaryonly',
      ]);
      wrapper.unmount();
    });

    it('should apply the namespace filter to deployments and workloads but not to nodes', async() => {
      mockNamespaceFilterParam.value = 'projectsornamespaces=default';
      const { wrapper } = mountComposable();

      await flushPromises();

      expect(requestedUrls()).toStrictEqual([
        `/v1/${ DEPLOYMENT }?exclude=metadata.managedFields&projectsornamespaces=default&summary=metadata.state.name&summaryonly`,
        `/v1/${ NODE }?exclude=metadata.managedFields&summary=metadata.state.name&summaryonly`,
        '/v1/batch.job?exclude=metadata.managedFields&projectsornamespaces=default&summary=metadata.state.name&summaryonly',
        '/v1/pod?exclude=metadata.managedFields&projectsornamespaces=default&summary=metadata.state.name&summaryonly',
      ]);
      wrapper.unmount();
    });

    it('should not fetch types that are not workloads', async() => {
      counts.persistentvolume = countEntry({ error: 1 });
      const { wrapper } = mountComposable();

      await flushPromises();

      expect(requestedUrls().some((url) => url.includes('persistentvolume'))).toStrictEqual(false);
      wrapper.unmount();
    });

    it('should not fetch types the user cannot list', async() => {
      const { wrapper } = mountComposable({ 'cluster/canList': (type: string) => type === 'pod' });

      await flushPromises();

      expect(requestedUrls()).toStrictEqual(['/v1/pod?exclude=metadata.managedFields&summary=metadata.state.name&summaryonly']);
      wrapper.unmount();
    });

    it('should resolve the state colors of the responses', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();

      expect(mockResolveStateColors).toHaveBeenCalledWith([
        { type: DEPLOYMENT, summary: defaultResponses[DEPLOYMENT].summary },
        { type: NODE, summary: defaultResponses[NODE].summary },
        { type: 'batch.job', summary: defaultResponses['batch.job'].summary },
        { type: 'pod', summary: defaultResponses.pod.summary },
      ]);
      wrapper.unmount();
    });

    it('should refetch when the counts of a fetched type change', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();

      mockGetters['cluster/all'] = () => [{ counts: { ...counts, [DEPLOYMENT]: countEntry({}, 2) } }];
      await flushPromises();

      expect(requestedUrls()).toHaveLength(4);
      wrapper.unmount();
    });

    it('should not refetch when the counts of a type that is not fetched change', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();

      mockGetters['cluster/all'] = () => [{ counts: { ...counts, persistentvolume: countEntry({}, 5) } }];
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([]);
      wrapper.unmount();
    });

    it('should refetch with the new namespace filter when it changes', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();

      mockNamespaceFilterParam.value = 'projectsornamespaces=default';
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([
        `/v1/${ DEPLOYMENT }?exclude=metadata.managedFields&projectsornamespaces=default&summary=metadata.state.name&summaryonly`,
        `/v1/${ NODE }?exclude=metadata.managedFields&summary=metadata.state.name&summaryonly`,
        '/v1/batch.job?exclude=metadata.managedFields&projectsornamespaces=default&summary=metadata.state.name&summaryonly',
        '/v1/pod?exclude=metadata.managedFields&projectsornamespaces=default&summary=metadata.state.name&summaryonly',
      ]);
      wrapper.unmount();
    });

    it('should only use the latest response when requests overlap', async() => {
      let resolveFirst: (value: unknown) => void = () => {};

      responses[NODE] = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      mockDispatch.mockImplementation((action: string, { url }: { url: string }) => {
        const type = url.replace('/v1/', '').split('?')[0];

        return Promise.resolve(responses[type] || summaryResponse({}));
      });

      const { wrapper, result } = mountComposable();

      await flushPromises();
      responses[NODE] = summaryResponse({ active: 7 });
      mockGetters['cluster/all'] = () => [{ counts: { ...counts, [NODE]: countEntry({}, 7) } }];
      await flushPromises();
      resolveFirst(summaryResponse({ active: 1 }));
      await flushPromises();

      expect(result.nodesCard.value?.total).toStrictEqual(7);
      wrapper.unmount();
    });

    it('should ignore a response that arrives after unmount', async() => {
      const { wrapper, result } = mountComposable();

      wrapper.unmount();
      await flushPromises();

      expect(result.loaded.value).toStrictEqual(false);
    });
  });

  describe('summary cards', () => {
    it('should build the deployments card', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.deploymentsCard.value).toStrictEqual({
        key:      DEPLOYMENT,
        title:    'Deployments',
        to:       route(DEPLOYMENT),
        total:    4,
        segments: [{ color: 'error', percent: 25 }, { color: 'success', percent: 75 }],
        rows:     [
          {
            key: 'error', label: 'Error', color: 'error', count: 1, to: route(DEPLOYMENT, 'error')
          },
          {
            key: 'active', label: 'Active', color: 'success', count: 3, to: route(DEPLOYMENT, 'active')
          },
        ],
      });
      wrapper.unmount();
    });

    it('should build the nodes card', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.nodesCard.value).toStrictEqual({
        key:      NODE,
        title:    'Nodes',
        to:       route(NODE),
        total:    2,
        segments: [{ color: 'success', percent: 100 }],
        rows:     [{
          key: 'active', label: 'Active', color: 'success', count: 2, to: route(NODE, 'active')
        }],
      });
      wrapper.unmount();
    });

    it('should build an empty card when there are no items', async() => {
      responses[DEPLOYMENT] = summaryResponse({});
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.deploymentsCard.value?.rows).toStrictEqual([]);
      wrapper.unmount();
    });

    it.each([
      ['deploymentsCard', DEPLOYMENT],
      ['nodesCard', NODE],
    ] as const)('should not build the %p when the user cannot list %p', async(card, type) => {
      const { wrapper, result } = mountComposable({ 'cluster/canList': (t: string) => t !== type });

      await flushPromises();

      expect(result[card].value).toBeNull();
      wrapper.unmount();
    });

    it('should not build a card when its request fails', async() => {
      responses[NODE] = new Error('boom');
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.nodesCard.value).toBeNull();
      wrapper.unmount();
    });
  });

  describe('unhealthy rows', () => {
    it('should list error and warning counts per type', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.unhealthyRows.value).toStrictEqual([{
        key:    'pod',
        label:  'Pods',
        to:     route('pod'),
        counts: [
          {
            color: 'error', count: 3, to: route('pod', 'crashloopbackoff,error')
          },
          {
            color: 'warning', count: 1, to: route('pod', 'degraded')
          },
        ],
      }]);
      wrapper.unmount();
    });

    it('should leave out types with no error or warning states', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.unhealthyRows.value.map((r) => r.key)).not.toContain('batch.job');
      wrapper.unmount();
    });

    it('should leave out deployments and nodes', async() => {
      counts[DEPLOYMENT] = countEntry({ error: 1 });
      counts[NODE] = countEntry({ error: 1 });
      responses[NODE] = summaryResponse({ error: 1 });
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.unhealthyRows.value.map((r) => r.key)).toStrictEqual(['pod']);
      wrapper.unmount();
    });

    it('should leave out hidden types', async() => {
      counts['apps.daemonset'] = countEntry({ error: 1 });
      const { wrapper } = mountComposable({ 'type-map/isIgnored': (schema: { id: string }) => schema.id === 'apps.daemonset' });

      await flushPromises();

      expect(requestedUrls().some((url) => url.includes('apps.daemonset'))).toStrictEqual(false);
      wrapper.unmount();
    });

    it('should leave out zero counts', async() => {
      responses.pod = summaryResponse({ error: 0, degraded: 2 });
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.unhealthyRows.value[0].counts).toStrictEqual([{
        color: 'warning', count: 2, to: route('pod', 'degraded')
      }]);
      wrapper.unmount();
    });

    it('should leave out a type whose request fails', async() => {
      responses.pod = new Error('boom');
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.unhealthyRows.value).toStrictEqual([]);
      wrapper.unmount();
    });

    it('should sort the rows by label', async() => {
      responses['batch.job'] = summaryResponse({ error: 1 });
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.unhealthyRows.value.map((r) => r.label)).toStrictEqual(['Jobs', 'Pods']);
      wrapper.unmount();
    });

    it('should be empty when no type has problems', async() => {
      counts = {
        [DEPLOYMENT]: countEntry(), [NODE]: countEntry(), pod: countEntry()
      };
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.unhealthyRows.value).toStrictEqual([]);
      wrapper.unmount();
    });
  });
});
