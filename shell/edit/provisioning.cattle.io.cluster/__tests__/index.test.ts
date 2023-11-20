import { createLocalVue, shallowMount } from '@vue/test-utils';
import ClusterCreate from '@shell/edit/provisioning.cattle.io.cluster/index.vue';

describe('component: Cluster: Create', () => {
  it('should hide RKE1 and RKE2 toggle button', () => {
    const mockedValidationMixin = {
      methods: {
        fvFormIsValid:                jest.fn(),
        type:                         jest.fn(),
        fvUnreportedValidationErrors: jest.fn(),
        fvGetAndReportPathRules:      jest.fn(),
      }
    };

    const mockedClusterCreateMixin = {
      methods: {
        selectType: jest.fn(),
        errors:     jest.fn(),
      }
    };

    const MockedClusterCreate = { ...ClusterCreate, mixins: [ mockedClusterCreateMixin] };
    const wrapper = shallowMount(MockedClusterCreate, {
      propsData: {
        value:         { metadata: {}, spec: { template: {} } },
        realMode:      '',
        mode:      '',
        params:        {},
        fvFormIsValid: {}
      },
      mocks: {
        $route:      { params: {}, query: {} },
        $router:     { applyQuery: jest.fn() },
        $fetchState: { pending: false },
        namespace:   true,
        $store:      {
          getters: {
            'type-map/activeProducts': () => [],
            'i18n/t':            jest.fn(),
          },
        },
      },
      // stubs: {
      //   Tab:                 true,
      //   LabeledInput:        true,
      //   VolumeClaimTemplate: true,
      //   Networking:          true,
      //   Job:                 true,
      //   NodeScheduling:      true,
      //   PodAffinity:         true,
      //   Tolerations:         true,
      //   Storage:             true,
      //   Tabbed:              true,
      //   LabeledSelect:       true,
      //   NameNsDescription:   true,
      //   CruResource:         true,
      //   KeyValue:            true
      // }
    });

    // const result = (wrapper.vm as any).mapError(oldMessage).message;
    const element = wrapper.find('data-testid="cluster-manager-create-rke-switch"').element;
    expect(element).toBeDefined();
  });
});
