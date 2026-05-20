import { shallowMount } from '@vue/test-utils';
import CruImported from '@pkg/imported/components/CruImported.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { IMPORTED_CLUSTER_VERSION_MANAGEMENT } from '@shell/config/labels-annotations';

describe('cruImported component', () => {
  const defaultSetup = {
    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/t':               (key: string) => key,
            'features/get':         () => false,
            'prefs/get':            () => [],
            currentStore:           () => 'rancher',
            'rancher/schemaFor':    jest.fn(),
            'management/schemaFor': jest.fn(),
          },
          dispatch: jest.fn().mockResolvedValue({}),
        },
        $route:      { query: {} },
        $fetchState: { pending: false }
      },
      stubs: {
        CruResource:             { template: '<div><slot></slot></div>' },
        Accordion:               { template: '<div class="accordion"><slot></slot></div>' },
        Banner:                  true,
        ClusterMembershipEditor: true,
        Labels:                  true,
        Basics:                  true,
        ACE:                     true,
        Checkbox:                true,
        SchedulingCustomization: true,
        KeyValue:                true,
        NameNsDescription:       true,
        Loading:                 true,
        'router-link':           true
      }
    },
    data: () => ({
      normanCluster: {
        name:                     '',
        annotations:              { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' },
        importedConfig:           {},
        localClusterAuthEndpoint: {}
      }
    })
  };

  describe('networking tab visibility', () => {
    it('should show the networking tab when not in create mode, not RKE1, and not local', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(true);
    });

    it('should hide the networking tab in create mode', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _CREATE,
          value: {
            isRke1:  false,
            isLocal: false,
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });

    it('should show the networking tab when not in create mode, not RKE1, is local, and enableNetworkPolicySupported is true', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             false,
            isRke2:            false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(true);
    });

    it('should hide the networking tab when not in create mode, not RKE1, is local, and enableNetworkPolicySupported is false', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             true,
            isRke2:            false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });

    it('should not display the ACE component if cluster is local', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const ace = wrapper.findComponent({ name: 'ACE' });

      expect(ace.exists()).toBe(false);
    });
    it('should display the ACE component if cluster is not local', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           false,
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const ace = wrapper.findComponent({ name: 'ACE' });

      expect(ace.exists()).toBe(true);
    });
  });
});
