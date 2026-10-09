import { defineComponent, h, reactive, ref } from 'vue';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { useResourceStateSummaries, RETRY_INTERVAL_MS, type UseResourceStateSummariesOptions } from '@shell/components/ResourceStatusWidget/useResourceStateSummaries';
import { COUNT, NODE, WORKLOAD_TYPES } from '@shell/config/types';

const DEPLOYMENT = WORKLOAD_TYPES.DEPLOYMENT;

const mockGetters: Record<string, any> = reactive({});
const mockDispatch = jest.fn();
const mockResolveStateColors = jest.fn();
const mockNamespaceFilterParam = ref('');

jest.mock('vuex', () => ({ useStore: () => ({ getters: mockGetters, dispatch: mockDispatch }) }));

jest.mock('lodash/debounce', () => (fn: () => void) => Object.assign(() => fn(), { cancel: jest.fn() }));

jest.mock('@shell/composables/useNamespaceFilterParam', () => ({ useNamespaceFilterParam: () => mockNamespaceFilterParam }));

jest.mock('@shell/composables/useStateColor', () => ({ useStateColor: () => ({ resolveStateColors: mockResolveStateColors }) }));

const schemas: Record<string, any> = {
  [DEPLOYMENT]: { id: DEPLOYMENT, attributes: { namespaced: true } },
  [NODE]:       { id: NODE, attributes: { namespaced: false } },
  pod:          { id: 'pod', attributes: { namespaced: true } },
};

function countEntry(count = 1) {
  return { summary: { count, states: {} } };
}

function summaryResponse(counts: Record<string, number>, property = 'metadata.state.name') {
  return {
    summary: [{
      property,
      counts: Object.fromEntries(Object.entries(counts).map(([state, total]) => [state, { total, namespace: {} }])),
    }],
  };
}

const defaultResponses: Record<string, any> = {
  [DEPLOYMENT]: summaryResponse({ active: 3, error: 1 }),
  [NODE]:       summaryResponse({ active: 2 }),
  pod:          summaryResponse({ running: 5 }),
};

let responses: Record<string, any> = {};
let counts: Record<string, any> = {};

function setupGetters() {
  Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
  Object.assign(mockGetters, {
    'cluster/all':       (type: string) => (type === COUNT ? [{ counts }] : []),
    'cluster/schemaFor': (type: string) => schemas[type],
    'cluster/urlFor':    (type: string) => `/v1/${ type }?exclude=metadata.managedFields`,
  });
}

function requestedUrls(): string[] {
  return mockDispatch.mock.calls.filter(([action]) => action === 'cluster/request').map(([, { url }]) => url);
}

function url(type: string, namespaceParam?: string) {
  return `/v1/${ type }?exclude=metadata.managedFields${ namespaceParam ? `&${ namespaceParam }` : '' }&summary=metadata.state.name&summaryonly`;
}

function mountComposable(types: any = [DEPLOYMENT, NODE], options: UseResourceStateSummariesOptions = {}) {
  setupGetters();

  let result: ReturnType<typeof useResourceStateSummaries>;

  const wrapper = shallowMount(defineComponent({
    setup() {
      result = useResourceStateSummaries(types, options);

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

describe('composable: useResourceStateSummaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNamespaceFilterParam.value = '';
    counts = {
      [DEPLOYMENT]: countEntry(), [NODE]: countEntry(), pod: countEntry()
    };
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

    it('should be loaded when there are no types', async() => {
      const { wrapper, result } = mountComposable([]);

      await flushPromises();

      expect(result.loaded.value).toStrictEqual(true);
      wrapper.unmount();
    });

    it('should fetch a state summary for each type', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();

      expect(requestedUrls()).toStrictEqual([url(DEPLOYMENT), url(NODE)]);
      wrapper.unmount();
    });

    it('should apply the namespace filter to namespaced types only', async() => {
      mockNamespaceFilterParam.value = 'projectsornamespaces=default';
      const { wrapper } = mountComposable();

      await flushPromises();

      expect(requestedUrls()).toStrictEqual([url(DEPLOYMENT, 'projectsornamespaces=default'), url(NODE)]);
      wrapper.unmount();
    });

    it('should not apply the namespace filter when it is not followed', async() => {
      mockNamespaceFilterParam.value = 'projectsornamespaces=default';
      const { wrapper } = mountComposable([DEPLOYMENT], { followNamespaceFilter: false });

      await flushPromises();

      expect(requestedUrls()).toStrictEqual([url(DEPLOYMENT)]);
      wrapper.unmount();
    });

    it('should resolve the state colors of the responses', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();

      expect(mockResolveStateColors).toHaveBeenCalledWith([
        { type: DEPLOYMENT, summary: defaultResponses[DEPLOYMENT].summary },
        { type: NODE, summary: defaultResponses[NODE].summary },
      ]);
      wrapper.unmount();
    });
  });

  describe('refetching', () => {
    it('should refetch when the counts of a fetched type change', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();

      mockGetters['cluster/all'] = () => [{ counts: { ...counts, [DEPLOYMENT]: countEntry(2) } }];
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([url(DEPLOYMENT), url(NODE)]);
      wrapper.unmount();
    });

    it('should not refetch when the counts of a type that is not fetched change', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();

      mockGetters['cluster/all'] = () => [{ counts: { ...counts, pod: countEntry(5) } }];
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([]);
      wrapper.unmount();
    });

    it('should refetch when the types change', async() => {
      const types = ref([DEPLOYMENT]);
      const { wrapper } = mountComposable(types);

      await flushPromises();
      mockDispatch.mockClear();

      types.value = [DEPLOYMENT, 'pod'];
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([url(DEPLOYMENT), url('pod')]);
      wrapper.unmount();
    });

    it('should refetch with the new namespace filter when it changes', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();

      mockNamespaceFilterParam.value = 'projectsornamespaces=default';
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([url(DEPLOYMENT, 'projectsornamespaces=default'), url(NODE)]);
      wrapper.unmount();
    });

    it('should not refetch when the namespace filter changes and it is not followed', async() => {
      const { wrapper } = mountComposable([DEPLOYMENT], { followNamespaceFilter: false });

      await flushPromises();
      mockDispatch.mockClear();

      mockNamespaceFilterParam.value = 'projectsornamespaces=default';
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([]);
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
      mockGetters['cluster/all'] = () => [{ counts: { ...counts, [NODE]: countEntry(7) } }];
      await flushPromises();
      resolveFirst(summaryResponse({ active: 1 }));
      await flushPromises();

      expect(result.stateCounts(NODE)).toStrictEqual({ active: 7 });
      wrapper.unmount();
    });

    it('should ignore a response that arrives after unmount', async() => {
      const { wrapper, result } = mountComposable();

      wrapper.unmount();
      await flushPromises();

      expect(result.loaded.value).toStrictEqual(false);
    });
  });

  describe('stateCounts', () => {
    it('should return the count of each state', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.stateCounts(DEPLOYMENT)).toStrictEqual({ active: 3, error: 1 });
      wrapper.unmount();
    });

    it('should be empty when there are no items', async() => {
      responses[DEPLOYMENT] = { summary: [] };
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.stateCounts(DEPLOYMENT)).toStrictEqual({});
      wrapper.unmount();
    });

    it('should leave out other properties', async() => {
      responses[DEPLOYMENT] = summaryResponse({ default: 4 }, 'metadata.namespace');
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.stateCounts(DEPLOYMENT)).toStrictEqual({});
      wrapper.unmount();
    });

    it('should be null when the request fails', async() => {
      responses[NODE] = new Error('boom');
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.stateCounts(NODE)).toBeNull();
      wrapper.unmount();
    });

    it('should be null for a type that was not fetched', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.stateCounts('pod')).toBeNull();
      wrapper.unmount();
    });
  });

  describe('retrying', () => {
    let hidden = false;

    beforeAll(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    });

    afterAll(() => {
      delete (document as any).hidden;
    });

    beforeEach(() => {
      hidden = false;
      // flushPromises relies on setImmediate
      jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    async function failNodesThenRetry() {
      responses[NODE] = new Error('boom');
      const mounted = mountComposable();

      await flushPromises();
      responses[NODE] = defaultResponses[NODE];
      mockDispatch.mockClear();

      return mounted;
    }

    it('should fetch again after the retry interval when a request failed', async() => {
      const { wrapper } = await failNodesThenRetry();

      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([url(DEPLOYMENT), url(NODE)]);
      wrapper.unmount();
    });

    it('should not fetch again before the retry interval', async() => {
      const { wrapper } = await failNodesThenRetry();

      jest.advanceTimersByTime(RETRY_INTERVAL_MS - 1);
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([]);
      wrapper.unmount();
    });

    it('should show the counts once the retry succeeds', async() => {
      const { wrapper, result } = await failNodesThenRetry();

      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      await flushPromises();

      expect(result.stateCounts(NODE)).toStrictEqual({ active: 2 });
      wrapper.unmount();
    });

    it('should not fetch again when every request succeeded', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();
      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([]);
      wrapper.unmount();
    });

    it('should not fetch again while the tab is hidden', async() => {
      const { wrapper } = await failNodesThenRetry();

      hidden = true;
      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([]);
      wrapper.unmount();
    });

    it('should fetch again when the tab becomes visible after a missed retry', async() => {
      const { wrapper } = await failNodesThenRetry();

      hidden = true;
      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      hidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([url(DEPLOYMENT), url(NODE)]);
      wrapper.unmount();
    });

    it('should not fetch when the tab becomes visible and no retry was missed', async() => {
      const { wrapper } = mountComposable();

      await flushPromises();
      mockDispatch.mockClear();
      document.dispatchEvent(new Event('visibilitychange'));
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([]);
      wrapper.unmount();
    });

    it('should not fetch again after unmount', async() => {
      const { wrapper } = await failNodesThenRetry();

      wrapper.unmount();
      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      await flushPromises();

      expect(requestedUrls()).toStrictEqual([]);
    });
  });
});
