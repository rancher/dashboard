import { useWorkloadDashboard } from '@shell/pages/c/_cluster/explorer/workload-dashboard/composable';
import { WORKLOAD_RESOURCE_TYPES } from '@shell/pages/c/_cluster/explorer/workload-dashboard/types';
import { defineComponent, effectScope, h } from 'vue';
import { shallowMount, flushPromises } from '@vue/test-utils';

const mockGetters: Record<string, any> = {};
const mockDispatch = jest.fn();

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

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string, args?: Record<string, any>) => `%${ key }%${ args ? JSON.stringify(args) : '' }` }) }));

jest.mock('@shell/plugins/steve/steve-pagination-utils', () => ({
  __esModule: true,
  default:    { createParamsFromNsFilter: jest.fn(() => ({ projectsOrNamespaces: [], filters: [] })) },
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

function withScope(fn: () => void): void {
  const scope = effectScope();

  scope.run(fn);
  scope.stop();
}

const summaryResponse = {
  summary: [{ property: 'metadata.state.name', counts: { running: 5, error: 2 } }],
  data:    [],
};

function mountComposable(getterOverrides: Record<string, any> = {}) {
  setupGetters({
    'cluster/schemaFor': () => ({ links: { collection: '/v1/test' } }),
    ...getterOverrides,
  });

  mockDispatch.mockImplementation((action: string) => {
    if (action === 'cluster/request') {
      return Promise.resolve(summaryResponse);
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
  });

  describe('namespaceSubtitle', () => {
    it('should return namespacedOnly subtitle when namespaceMode is namespaced', () => {
      setupGetters({ namespaceMode: 'namespaced' });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.namespacedOnly%{"count":0}');
      });
    });

    it('should return clusterOnly subtitle when namespaceMode is cluster', () => {
      setupGetters({ namespaceMode: 'cluster' });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.clusterOnly%{"count":0}');
      });
    });

    it('should return allNamespaces subtitle when isAllNamespaces is true', () => {
      setupGetters({ isAllNamespaces: true, namespaceMode: 'both' });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.allNamespaces%{"count":0}');
      });
    });

    it('should return userNamespaces subtitle for ALL_USER filter', () => {
      setupGetters({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: ['all://user'],
      });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.userNamespaces%{"count":0}');
      });
    });

    it('should return systemNamespaces subtitle for ALL_SYSTEM filter', () => {
      setupGetters({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: ['all://system'],
      });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.systemNamespaces%{"count":0}');
      });
    });

    it('should return project subtitle for project filter', () => {
      const projectId = 'p-12345';

      setupGetters({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: [`project://${ projectId }`],
        'management/all': () => [{
          id: `local/${ projectId }`, nameDisplay: 'My Project', metadata: { name: projectId }
        }],
      });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual(`%workloadDashboard.subtitle.project%{"name":"My Project","count":0}`);
      });
    });

    it('should return namespace subtitle for namespace filter', () => {
      setupGetters({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: ['ns://cattle-system'],
      });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.namespace%{"name":"cattle-system","count":0}');
      });
    });

    it('should return multipleSelected subtitle for multiple filters', () => {
      setupGetters({
        isAllNamespaces:  false,
        namespaceMode:    'both',
        namespaceFilters: ['ns://default', 'ns://kube-system'],
      });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.multipleSelected%{"selected":2,"count":0}');
      });
    });

    it('should check namespaceMode before isAllNamespaces', () => {
      setupGetters({
        isAllNamespaces: true,
        namespaceMode:   'namespaced',
      });

      withScope(() => {
        const { namespaceSubtitle } = useWorkloadDashboard();

        expect(namespaceSubtitle.value).toStrictEqual('%workloadDashboard.subtitle.namespacedOnly%{"count":0}');
      });
    });
  });

  describe('hasWorkloads', () => {
    it('should return false when there are no summaries', () => {
      withScope(() => {
        const { hasWorkloads } = useWorkloadDashboard();

        expect(hasWorkloads.value).toStrictEqual(false);
      });
    });

    it('should return true when summaries contain workloads', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.hasWorkloads.value).toStrictEqual(true);
      wrapper.unmount();
    });
  });

  describe('resourceRoute', () => {
    it('should return route without query when no stateNames provided', () => {
      withScope(() => {
        const { resourceRoute } = useWorkloadDashboard();
        const route = resourceRoute('apps.deployment');

        expect(route).toStrictEqual({
          name:   'c-cluster-product-resource',
          params: {
            cluster:  'local',
            product:  'explorer',
            resource: 'apps.deployment',
          },
        });
      });
    });

    it('should include state filter query when stateNames are provided', () => {
      withScope(() => {
        const { resourceRoute } = useWorkloadDashboard();
        const route = resourceRoute('apps.deployment', ['running', 'active']);

        expect((route as any).query).toStrictEqual({ q: '"metadata.state.name":"running","metadata.state.name":"active"' });
      });
    });

    it('should not include query for empty stateNames array', () => {
      withScope(() => {
        const { resourceRoute } = useWorkloadDashboard();
        const route = resourceRoute('apps.deployment', []);

        expect((route as any).query).toBeUndefined();
      });
    });
  });

  describe('resetNamespaceFilter', () => {
    it('should dispatch switchNamespaces with empty ids', () => {
      withScope(() => {
        const { resetNamespaceFilter } = useWorkloadDashboard();

        resetNamespaceFilter();

        expect(mockDispatch).toHaveBeenCalledWith('switchNamespaces', { ids: [], key: 'local' });
      });
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

    it('should set heroMode to wide when there is exactly one other card', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.byStateLayout.value.heroMode).toStrictEqual('wide');
      wrapper.unmount();
    });

    it('should set subHero to null when there are fewer than 3 other cards', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.byStateLayout.value.subHero).toBeNull();
      wrapper.unmount();
    });

    it('should set gridRows to 1 when there is one non-hero card', async() => {
      const { wrapper, result } = mountComposable();

      await flushPromises();

      expect(result.byStateLayout.value.gridRows).toStrictEqual(1);
      wrapper.unmount();
    });
  });
});
