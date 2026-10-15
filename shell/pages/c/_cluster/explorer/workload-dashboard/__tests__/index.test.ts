import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import WorkloadDashboard from '@shell/pages/c/_cluster/explorer/workload-dashboard/index.vue';
import WorkloadSearch from '@shell/pages/c/_cluster/explorer/workload-dashboard/search/WorkloadSearch.vue';

const mockLoading = ref(false);
const mockHasWorkloads = ref(true);
const mockResourceRoute = jest.fn();
const mockNavigateToNamespace = jest.fn();

jest.mock('@shell/pages/c/_cluster/explorer/workload-dashboard/composable', () => ({
  useWorkloadDashboard: () => ({
    loading:              mockLoading,
    fetchError:           ref(null),
    hasWorkloads:         mockHasWorkloads,
    namespaceSubtitle:    ref(''),
    byStateLayout:        ref([]),
    byTypeCards:          ref([]),
    byNamespaceCards:     ref([]),
    resetNamespaceFilter: jest.fn(),
    filterByNamespace:    jest.fn(),
    resourceRoute:        mockResourceRoute,
    navigateToNamespace:  mockNavigateToNamespace,
  }),
}));

jest.mock('vuex', () => ({
  ...jest.requireActual('vuex'),
  useStore: () => ({}),
}));

describe('page: workload dashboard', () => {
  beforeEach(() => {
    mockLoading.value = false;
    mockHasWorkloads.value = true;
  });

  describe('workload search', () => {
    it('should render the search when there are workloads', () => {
      const wrapper = shallowMount(WorkloadDashboard);

      expect(wrapper.findComponent(WorkloadSearch).exists()).toBe(true);
    });

    it('should not render the search when there are no workloads', () => {
      mockHasWorkloads.value = false;
      const wrapper = shallowMount(WorkloadDashboard);

      expect(wrapper.findComponent(WorkloadSearch).exists()).toBe(false);
    });

    it('should not render the search while loading', () => {
      mockLoading.value = true;
      const wrapper = shallowMount(WorkloadDashboard);

      expect(wrapper.findComponent(WorkloadSearch).exists()).toBe(false);
    });

    it('should give the search the dashboard route builder', () => {
      const wrapper = shallowMount(WorkloadDashboard);

      expect(wrapper.findComponent(WorkloadSearch).props('resourceRoute')).toBe(mockResourceRoute);
    });

    it('should give the search the dashboard namespace navigation', () => {
      const wrapper = shallowMount(WorkloadDashboard);

      expect(wrapper.findComponent(WorkloadSearch).props('navigateToNamespace')).toBe(mockNavigateToNamespace);
    });
  });
});
