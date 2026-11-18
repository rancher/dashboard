import { mergeWithReplace } from '@shell/utils/object';
import Dashboard from '@shell/pages/c/_cluster/explorer/index.vue';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { METRIC, NODE, WORKLOAD_TYPES } from '@shell/config/types';

interface MockCluster {
  id: string;
  metadata: { creationTimestamp: number };
  status: {
    provider: string;
    componentStatuses?: { name: string, conditions: unknown }[];
    allocatable?: Record<string, string>;
    requested?: Record<string, string>;
  };
  isLocal?: boolean;
  /** Folded in from the management-cluster fixtures via `mergeWithReplace`. */
  provisionerDisplay?: string;
  architecture?: { label: string | null };
}

interface MockGetters {
  currentCluster: MockCluster;
  'management/byId': jest.Mock;
  'cluster/inError': () => boolean;
  'cluster/schemaFor': jest.Mock;
  'cluster/canList': (type: string) => boolean;
  'cluster/haveAll'?: (type: string) => boolean;
  'cluster/byId': () => object;
  'cluster/all': jest.Mock;
  'i18n/exists': jest.Mock;
  'i18n/t': (label: string) => unknown;
}

/**
 * Without an explicit type `vue-tsc` infers this from the object literal below and
 * narrows every mock to exactly the value it is seeded with, so the individual
 * tests can no longer add `componentStatuses`, `isLocal` or `$router`, nor swap a
 * `jest.fn()` for a plain stub. Describe the mock surface the tests drive instead.
 */
type DashboardMountOptions = {
  global: {
    stubs: Record<string, boolean>;
    mocks: {
      $router?: { push: (route: unknown) => void };
      $store: {
        dispatch: jest.Mock;
        getters: MockGetters;
      };
    };
  };
}

/** `mergeWithReplace` is declared in plain JS and so is typed as returning `Object`. */
const asMockCluster = (merged: Object): MockCluster => merged as MockCluster;

type State = typeof STATES_ENUM[keyof typeof STATES_ENUM];

/** `[state, iconClass, isLoaded, disconnected, error, conditions, readyReplicas, unavailableReplicas]` */
type AgentStatusRow = [State, string, boolean, boolean, boolean, { status: string }[] | string, number, number];

/** `[state, iconClass, clickable, isLoaded, disconnected, error, conditions, readyReplicas, unavailableReplicas]` */
type ClickableAgentStatusRow = [State, string, boolean, boolean, boolean, boolean, { status: string }[] | string, number, number];

/** `[clusterLabel, agentId, isLocal, agentResources, statuses]` */
type AgentHealthBoxCase<T> = [string, string, boolean, string[], T[]];

describe('page: cluster dashboard', () => {
  const createMountOptions = (): DashboardMountOptions => ({
    global: {
      stubs: {
        'router-link': true,
        LiveDate:      true
      },
      mocks: {
        $store: {
          dispatch: jest.fn(),
          getters:  {
            currentCluster: {
              id:       'cluster',
              metadata: { creationTimestamp: Date.now() },
              status:   { provider: 'foo' },
            },
            'management/byId':   jest.fn(),
            'cluster/inError':   () => false,
            'cluster/schemaFor': jest.fn(),
            'cluster/canList':   jest.fn(),
            'cluster/byId':      () => {
              return {};
            },
            'cluster/all': jest.fn(),
            'i18n/exists': jest.fn(),
            'i18n/t':      (label: string) => label === 'generic.provisioning' ? '—' : jest.fn()(),
          }
        }
      },
    }
  });

  describe.each([
    'etcd',
    'scheduler',
    'controller-manager',
  ])('%p component health box', (componentId) => {
    it.each([
      [STATES_ENUM.HEALTHY, 'icon-checkmark', '', []],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', `foo`, []],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', `${ componentId }foo`, [{ status: 'True' }]],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', `${ componentId }foo`, [{ status: 'False' }]],
    ])('should show %p status', (status, iconClass, name, conditions) => {
      const options = createMountOptions();

      options.global.mocks.$store.getters.currentCluster.status = {
        provider:          'provider',
        componentStatuses: [{
          name,
          conditions
        }],
      };

      const wrapper = shallowMount(Dashboard, options);

      const box = wrapper.find(`[data-testid="k8s-service-${ componentId }"]`);
      const icon = box.find('i');

      expect(box.element).toBeDefined();
      expect(box.element.classList).toContain(status);
      expect(icon.element.classList).toContain(iconClass);
    });
  });

  const agentHealthBoxCases: AgentHealthBoxCase<AgentStatusRow>[] = [
    ['local', 'fleet', true, ['fleetControllerResource', 'fleetAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', true, false, false, [{ status: 'True' }], 1, 0],
    ]],
    ['downstream RKE2', 'fleet', false, ['fleetAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', true, false, false, [{ status: 'True' }], 1, 0],
    ]],
    ['downstream RKE2', 'cattle', false, ['cattleAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', true, false, false, [{ status: 'True' }], 1, 0],
    ]]
  ];

  describe.each(agentHealthBoxCases)('%p cluster - %p agent health box :', (_, agentId, isLocal, agentResources, statuses) => {
    it.each(statuses)('should NOT show %p status due to missing canList permissions', (status, iconClass, isLoaded, disconnected, error, conditions, readyReplicas, unavailableReplicas) => {
      const options = createMountOptions();

      options.global.mocks.$store.getters.currentCluster.isLocal = isLocal;

      const resources = agentResources.reduce((acc, r) => {
        const agent = {
          metadata: { state: { error } },
          spec:     { replicas: 1 },
          status:   {
            readyReplicas,
            unavailableReplicas,
            conditions
          }
        };

        return isLoaded ? {
          ...acc,
          [r]: agent
        } : 'loading';
      }, {});

      const wrapper = shallowMount(Dashboard, {
        ...options,
        data: () => ({
          ...resources,
          disconnected,
          canViewAgents: true
        })
      });

      const box = wrapper.find(`[data-testid="k8s-service-${ agentId }"]`);

      expect(box.exists()).toBe(false);
    });
  });

  const clickableAgentHealthBoxCases: AgentHealthBoxCase<ClickableAgentStatusRow>[] = [
    ['local', 'fleet', true, ['fleetControllerResource', 'fleetAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', false, true, false, false, [{ status: 'True' }], 1, 0],
    ]],
    ['downstream RKE2', 'fleet', false, ['fleetAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', false, true, false, false, [{ status: 'True' }], 1, 0],
    ]],
    ['downstream RKE2', 'cattle', false, ['cattleAgentResource'], [
      [STATES_ENUM.IN_PROGRESS, 'icon-spinner', false, false, false, false, '', 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, false, [{ status: 'False' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, true, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.UNHEALTHY, 'icon-warning', true, true, false, true, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 0],
      [STATES_ENUM.WARNING, 'icon-warning', true, true, false, false, [{ status: 'True' }], 0, 1],
      [STATES_ENUM.HEALTHY, 'icon-checkmark', false, true, false, false, [{ status: 'True' }], 1, 0],
    ]]
  ];

  describe.each(clickableAgentHealthBoxCases)('%p cluster - %p agent health box ::', (_, agentId, isLocal, agentResources, statuses) => {
    it.each(statuses)('should show %p status', async(status, iconClass, clickable, isLoaded, disconnected, error, conditions, readyReplicas, unavailableReplicas) => {
      let agentRoute = null;

      const options = createMountOptions();

      options.global.mocks.$store.getters.currentCluster.isLocal = isLocal;

      options.global.mocks.$store.getters['cluster/canList'] = (type: string) => !!(type === WORKLOAD_TYPES.DEPLOYMENT) || !!(type === WORKLOAD_TYPES.STATEFUL_SET);

      options.global.mocks.$router = {
        push: (route: any) => {
          agentRoute = route;
        }
      };

      const resources = agentResources.reduce((acc, r) => {
        const agent = {
          metadata: { state: { error } },
          spec:     { replicas: 1 },
          status:   {
            readyReplicas,
            unavailableReplicas,
            conditions
          }
        };

        return isLoaded ? {
          ...acc,
          [r]: agent
        } : 'loading';
      }, {});

      const wrapper = shallowMount(Dashboard, {
        ...options,
        data: () => ({
          ...resources,
          disconnected,
          canViewAgents: true
        })
      });

      const box = wrapper.find(`[data-testid="k8s-service-${ agentId }"]`);
      const icon = box.find('i');

      expect(box.element).toBeDefined();
      expect(box.element.classList).toContain(status);
      expect(!!(box.element as any).__tooltipOptions__?.content).toBe(clickable);
      expect(icon.element.classList).toContain(iconClass);

      await box.trigger('click');

      expect(!!agentRoute).toBe(clickable);
    });
  });

  it('local cluster - cattle agent health box - should be hidden', () => {
    const options = createMountOptions();

    options.global.mocks.$store.getters.currentCluster.isLocal = true;

    const wrapper = shallowMount(Dashboard, {
      ...options,
      data: () => ({
        cattleAgentResource: 'loading',
        disconnected:        false,
        canViewAgents:       true
      })
    });

    const box = wrapper.find(`[data-testid="k8s-service-cattle"]`);

    expect(box.exists()).toBe(false);
  });

  describe('cluster details', () => {
    it.each([
      ['clusterProvider', 'abc', { provisionerDisplay: 'abc' }],
      ['kubernetesVersion', 'glance.version', null],
      ['created', 'glance.created', null],
      ['architecture', 'mixed', { architecture: { label: 'mixed' } }],
      ['architecture', 'amd64', { architecture: { label: 'amd64' } }],
      ['architecture', 'glance.architecture', { architecture: { label: null } }],
    ])('should show %p label %p', (label, text, mgmtCluster) => {
      const options = createMountOptions();

      const currentCluster = options.global.mocks.$store.getters['currentCluster'];

      options.global.mocks.$store.getters['currentCluster'] = mgmtCluster ? asMockCluster(mergeWithReplace(currentCluster, mgmtCluster)) : currentCluster; // eslint-disable-line jest/no-conditional-in-test

      const wrapper = shallowMount(Dashboard, options);

      const element = wrapper.find(`[data-testid="${ label }__label"]`).element;

      expect(element.textContent).toContain(text);
    });
  });

  describe('capacity', () => {
    const GiB = 1024 ** 3;

    // The usage of each node is below what's set aside for the system (capacity - allocatable), which used to be taken off it
    const node = (id: string, counted: boolean, size = 1, usage: { cpu: number, memory: number } | null = { cpu: 0.5, memory: GiB }) => ({
      id,
      isCountedInClusterResources: counted,
      usage,
      cpuUsage:                    usage?.cpu ?? 0,
      ramUsage:                    usage?.memory ?? 0,
      cpuCapacity:                 4 * size,
      cpuAllocatable:              3 * size,
      cpuReserved:                 1 * size,
      ramCapacity:                 8 * GiB * size,
      ramAllocatable:              6 * GiB * size,
      ramReserved:                 2 * GiB * size,
      podAllocatable:              100 * size,
      podReserved:                 10 * size,
    });

    const cordoned = node('cordoned', false, 25, { cpu: 50, memory: 100 * GiB });

    const createWrapper = ({ nodes = [node('counted-1', true), node('counted-2', true), cordoned], canListNodes = true, nodesLoaded = true } = {}) => {
      const options = createMountOptions();
      const { getters } = options.global.mocks.$store;

      getters['cluster/schemaFor'] = jest.fn((type: string) => ((type === NODE && canListNodes) || type === METRIC.NODE ? { id: type } : undefined));
      getters['cluster/canList'] = jest.fn((type: string) => type === NODE && canListNodes);
      getters['cluster/haveAll'] = jest.fn((type: string) => type === NODE && canListNodes && nodesLoaded);
      getters['cluster/all'] = jest.fn((type: string) => (type === NODE && canListNodes && nodesLoaded ? nodes : []));
      getters.currentCluster.status = {
        provider:    'foo',
        allocatable: {
          cpu: '6', memory: '12Gi', pods: '200'
        },
        requested: {
          cpu: '2', memory: '4Gi', pods: '20'
        },
      };
      options.global.mocks.$store.dispatch = jest.fn(() => Promise.resolve([]));

      return shallowMount(Dashboard, options);
    };

    it('should work out used as the usage of the counted nodes out of their capacity', async() => {
      const wrapper = createWrapper();

      await flushPromises();

      expect([wrapper.vm.cpuUsed?.total, wrapper.vm.cpuUsed?.useful]).toStrictEqual([8, 1]);
      expect([wrapper.vm.ramUsed?.total, wrapper.vm.ramUsed?.useful]).toStrictEqual([16 * GiB, 2 * GiB]);
      expect([wrapper.vm.ramUsed?.formattedUseful, wrapper.vm.ramUsed?.formattedTotal]).toStrictEqual(['2', '16 GiB']);
    });

    it('should add no usage for a counted node without metrics, and keep its capacity in the total', async() => {
      const wrapper = createWrapper({ nodes: [node('counted-1', true), node('no-metrics', true, 1, null)] });

      await flushPromises();

      expect([wrapper.vm.cpuUsed?.total, wrapper.vm.cpuUsed?.useful]).toStrictEqual([8, 0.5]);
      expect([wrapper.vm.ramUsed?.total, wrapper.vm.ramUsed?.useful]).toStrictEqual([16 * GiB, GiB]);
    });

    it('should say used only covers the nodes with metrics when a counted node has none', async() => {
      const wrapper = createWrapper({ nodes: [node('counted-1', true), node('counted-2', true), node('no-metrics', true, 1, null), cordoned] });

      await flushPromises();

      expect(wrapper.vm.reportingNodes).toStrictEqual(2);
      expect(wrapper.find('[data-testid="capacity-reporting-nodes"]').exists()).toBe(true);
    });

    it.each([
      ['every counted node has metrics', [node('counted-1', true), node('counted-2', true)]],
      ['only a node that is not counted has no metrics', [node('counted-1', true), node('cordoned-no-metrics', false, 1, null)]],
      ['no counted node has metrics, so used is left out', [node('no-metrics-1', true, 1, null), node('no-metrics-2', true, 1, null)]],
    ])('should not say used only covers some nodes when %s', async(_, nodes) => {
      const wrapper = createWrapper({ nodes });

      await flushPromises();

      expect(wrapper.find('[data-testid="capacity-reporting-nodes"]').exists()).toBe(false);
    });

    it('should leave used out when no counted node has metrics', async() => {
      const wrapper = createWrapper({ nodes: [node('no-metrics-1', true, 1, null), node('no-metrics-2', true, 1, null), cordoned] });

      await flushPromises();

      expect([wrapper.vm.cpuUsed, wrapper.vm.ramUsed]).toStrictEqual([null, null]);
    });

    it('should work out reserved as the requests of the counted nodes out of their allocatable', async() => {
      const wrapper = createWrapper();

      await flushPromises();

      expect([wrapper.vm.cpuReserved.total, wrapper.vm.cpuReserved.useful]).toStrictEqual([6, 2]);
      expect([wrapper.vm.ramReserved.total, wrapper.vm.ramReserved.useful]).toStrictEqual([12 * GiB, 4 * GiB]);
    });

    it('should work out the pods of the counted nodes out of their allocatable pods', async() => {
      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.vm.podsUsed).toStrictEqual({ total: 200, useful: 20 });
    });

    it('should say how many nodes are counted when some are not', async() => {
      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.find('[data-testid="capacity-counted-nodes"]').exists()).toBe(true);
    });

    it('should not say how many nodes are counted when they all are', async() => {
      const wrapper = createWrapper({ nodes: [node('counted-1', true), node('counted-2', true)] });

      await flushPromises();

      expect(wrapper.find('[data-testid="capacity-counted-nodes"]').exists()).toBe(false);
    });

    it('should keep both notes out of the capacity heading, so moving between headings reads only its label', async() => {
      const wrapper = createWrapper({ nodes: [node('counted-1', true), node('counted-2', true), node('no-metrics', true, 1, null), cordoned] });

      await flushPromises();

      expect(wrapper.findAll('[data-testid="capacity-counted-nodes"], [data-testid="capacity-reporting-nodes"]')).toHaveLength(2);
      expect(wrapper.findAll('h3 [data-testid="capacity-counted-nodes"], h3 [data-testid="capacity-reporting-nodes"]')).toHaveLength(0);
    });

    it('should not show the capacity when no node is counted', async() => {
      const wrapper = createWrapper({ nodes: [node('cordoned', false)] });

      await flushPromises();

      expect(wrapper.find('.hardware-resource-gauges').exists()).toBe(false);
    });

    it.each([
      ['the user can not list the nodes', { canListNodes: false }],
      ['the nodes are not loaded, e.g. while loading or when they fail to', { nodesLoaded: false }],
    ])('should take reserved and pods from the cluster status, without used, when %s', async(_, opts) => {
      const wrapper = createWrapper(opts);

      await flushPromises();

      expect([wrapper.vm.cpuReserved.total, wrapper.vm.cpuReserved.useful]).toStrictEqual([6, 2]);
      expect([wrapper.vm.ramReserved.total, wrapper.vm.ramReserved.useful]).toStrictEqual([12 * GiB, 4 * GiB]);
      expect(wrapper.vm.podsUsed).toStrictEqual({ total: 200, useful: 20 });
      expect([wrapper.vm.cpuUsed, wrapper.vm.ramUsed]).toStrictEqual([null, null]);
    });
  });
});
