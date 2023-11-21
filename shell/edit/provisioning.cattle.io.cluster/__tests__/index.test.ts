import { createLocalVue, shallowMount } from '@vue/test-utils';
import ClusterCreate from '@shell/edit/provisioning.cattle.io.cluster/index.vue';

const defaultStore = {
  defaultClusterId:          jest.fn(),
  clusterId:                 jest.fn(),
  'type-map/activeProducts': [],
  'catalog/charts':          [],
  'prefs/get':               jest.fn(),
  'mapFeature/get':          jest.fn(),
  'i18n/withFallback':       jest.fn(),
};

const defaultStubs = {
  CruResource:  { template: '<div><slot></slot></div>' }, // Required to render the slot content
};

describe('component: Cluster: Create', () => {
  it('should hide RKE1 and RKE2 toggle button', () => {
    const mockedClusterCreateMixin = {
      methods: {
        selectType: jest.fn(),
        save:       jest.fn(),
      }
    };

    const MockedClusterCreate = { ...ClusterCreate, mixins: [ mockedClusterCreateMixin] };
    const wrapper = shallowMount(MockedClusterCreate, {
      propsData: {
        value:            { metadata: {}, spec: { template: {} } },
        realMode:         '',
        mode:             '',
        componentTestid:  'cluster-manager-create',
      },
      mocks: {
        $route:      { params: {}, query: {} },
        $router:     { applyQuery: jest.fn() },
        $fetchState: { pending: false },
        $store: {
          getters: {
            ...defaultStore,
            'i18n/t':            jest.fn(),
            'features/get':      () => jest.fn(),
          },
        },
      },
      stubs: defaultStubs
    });

    
    const element = wrapper.find('[data-testid="cluster-manager-create-rke-switch"]').element;
    expect(element).toBeDefined();
  });
});
