import { shallowMount } from '@vue/test-utils';
import ClusterCreate from '@shell/edit/provisioning.cattle.io.cluster/index.vue';

describe('component: Cluster: Create', () => {
  it('should hide RKE1 and RKE2 toggle button if RKE1 ui feature flag is NOT set', () => {
    const wrapper = shallowMount(ClusterCreate, {
      computed:  { rke1UiEnabled: () => false },
      propsData: {
        value:           { metadata: {}, spec: { template: {} } },
        realMode:        '',
        mode:            'edit',
        componentTestid: 'cluster-manager-create',
      },
      mixins: [],
      mocks:  {
        $route:      { params: {}, query: {} },
        $router:     { applyQuery: jest.fn() },
        $fetchState: { pending: false },
        $store:      {
          getters: {
            'i18n/t':                  jest.fn(),
            'features/get':            () => jest.fn(),
            defaultClusterId:          jest.fn(),
            clusterId:                 jest.fn(),
            'type-map/activeProducts': [],
            'catalog/charts':          [],
            'prefs/get':               jest.fn(),
            'mapFeature/get':          jest.fn(),
            'i18n/withFallback':       jest.fn(),
          },
        },
      },
      stubs: { CruResource: { template: '<div><slot name="subtypes"></slot></div>' } }
    });

    const element = wrapper.find('[data-testid="cluster-manager-create-rke-switch"]').element;

    expect(element).not.toBeDefined();
  });
});
