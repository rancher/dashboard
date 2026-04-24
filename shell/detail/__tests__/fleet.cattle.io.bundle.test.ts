import { shallowMount, mount } from '@vue/test-utils';
import BundleDetail from '@shell/detail/fleet.cattle.io.bundle.vue';

describe('view: fleet.cattle.io.bundle', () => {
  const mockStore = {
    getters: {
      'i18n/t':                        (text: string) => text,
      'i18n/exists':                   jest.fn(),
      currentStore:                    () => 'management',
      'management/schemaFor':          jest.fn(),
      'management/all':                () => [],
      'management/pathExistsInSchema': () => false,
      'type-map/optionsFor':           () => ({}),
      'type-map/headersFor':           () => [],
      'cluster/schemaFor':             jest.fn(),
      'resource-fetch/refreshFlag':    () => false,
    },
    dispatch: jest.fn(),
  };

  const mockValue = {
    id:       'fleet-default/test-bundle',
    type:     'fleet.cattle.io.bundle',
    metadata: {
      name:      'test-bundle',
      namespace: 'fleet-default',
      labels:    {},
    },
    spec:           { targets: [] },
    status:         { conditions: [] },
    targetClusters: [],
  };

  const mockValueWithResources = {
    id:       'fleet-default/test-bundle',
    type:     'fleet.cattle.io.bundle',
    metadata: {
      name:      'test-bundle',
      namespace: 'fleet-default',
      labels:    {},
    },
    spec:   { targets: [] },
    status: {
      conditions: [
        {
          type:   'Ready',
          status: 'True',
        }
      ]
    },
    targetClusters: [
      {
        id:          'fleet-default/cluster-1',
        nameDisplay: 'cluster-1',
        metadata:    { labels: { 'management.cattle.io/cluster-name': 'c-m-abc123' } },
      },
    ],
  };

  const mockBundleDeployments = [
    {
      metadata: {
        labels: {
          'fleet.cattle.io/bundle-namespace':  'fleet-default',
          'fleet.cattle.io/bundle-name':       'test-bundle',
          'fleet.cattle.io/cluster-namespace': 'fleet-default',
          'fleet.cattle.io/cluster':           'cluster-1',
        },
      },
      status: {
        resources: [
          {
            kind:       'Deployment',
            apiVersion: 'apps/v1',
            namespace:  'default',
            name:       'nginx',
          },
          {
            kind:       'Service',
            apiVersion: 'v1',
            namespace:  'default',
            name:       'nginx-svc',
          },
        ],
      },
    },
  ];

  const fullMountGlobal = {
    mocks: {
      $store:      mockStore,
      $fetchState: { pending: false },
      $route:      { query: {}, hash: '' },
      $router:     {
        applyQuery:   jest.fn(),
        replace:      jest.fn(),
        currentRoute: { _value: { hash: '' } },
      },
    },
    stubs: {
      ResourceTable: true,
      teleport:      true,
    },
  };

  const createWrapper = (props = {}) => {
    return shallowMount(BundleDetail, {
      props: {
        value: mockValue,
        ...props,
      },
      global: {
        mocks: {
          $store:      mockStore,
          $fetchState: { pending: false },
          $route:      { query: {} },
          $router:     { applyQuery: jest.fn() },
        },
      },
    });
  };

  it('should render the bundle detail page', () => {
    const wrapper = createWrapper();

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should render the bundle detail page with full mount', () => {
    const wrapper = mount(BundleDetail, {
      props:  { value: mockValue },
      global: fullMountGlobal,
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should show Loading when fetch is pending', () => {
    const wrapper = shallowMount(BundleDetail, {
      props:  { value: mockValue },
      global: {
        mocks: {
          $store:      mockStore,
          $fetchState: { pending: true },
          $route:      { query: {} },
          $router:     { applyQuery: jest.fn() },
        },
      },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should render resources when bundle deployments exist', async() => {
    const wrapper = mount(BundleDetail, {
      props:  { value: mockValueWithResources },
      global: fullMountGlobal,
    });

    // Simulate fetch completion by setting allBundleDeployments
    (wrapper.vm as any).allBundleDeployments = mockBundleDeployments;
    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toMatchSnapshot();

    // Verify computed bundleResources are populated
    expect((wrapper.vm as any).bundleResources).toHaveLength(2);
    expect((wrapper.vm as any).bundleResources[0].name).toBe('nginx');
    expect((wrapper.vm as any).bundleResources[1].name).toBe('nginx-svc');
  });
});
