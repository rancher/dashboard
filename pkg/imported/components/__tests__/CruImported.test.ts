import { shallowMount } from '@vue/test-utils';
import CruImported from '@pkg/imported/components/CruImported.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { IMPORTED_CLUSTER_VERSION_MANAGEMENT, OPERATION_ANNOTATIONS } from '@shell/config/labels-annotations';
import { MANAGEMENT } from '@shell/config/types';

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

    it('should hide the networking tab for local RKE2 clusters detected via mgmt status provider', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             false,
            isRke2:            false,
            mgmt:              { status: { provider: 'rke2' } },
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });
    it('should hide the networking tab for local special RKE2 clusters detected via mgmt status provider', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: {
            id:                'cluster-id',
            isRke1:            false,
            isLocal:           true,
            isK3s:             false,
            isRke2:            false,
            mgmt:              { status: { provider: 'rke2.windows' } },
            findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup
      });

      const networkAccordion = wrapper.find('[data-testid="network-accordion"]');

      expect(networkAccordion.exists()).toBe(false);
    });
    it('should hide the networking tab for local K3s clusters', () => {
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

  describe('day 2 operations', () => {
    const mountDayTwoOpsWrapper = ({
      mode = _EDIT,
      value = {
        id:                'cluster-id',
        isLocal:           false,
        isRke1:            false,
        findNormanCluster: jest.fn().mockResolvedValue({})
      },
      annotations = { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' },
      dayTwoOpsGlobalSetting = false,
      managementById = jest.fn(),
      dispatch = jest.fn().mockResolvedValue({})
    } = {}) => {
      return shallowMount(CruImported, {
        propsData: {
          mode,
          value
        },
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: {
              ...defaultSetup.global.mocks.$store,
              getters: {
                ...defaultSetup.global.mocks.$store.getters,
                'management/byId': managementById,
              },
              dispatch,
            }
          }
        },
        data: () => ({
          normanCluster: {
            name:                     '',
            annotations,
            importedConfig:           {},
            localClusterAuthEndpoint: {}
          },
          dayTwoOpsGlobalSetting,
        })
      });
    };

    it('should prefer the annotation value over the global day two ops setting', () => {
      const wrapper = mountDayTwoOpsWrapper({
        annotations: {
          [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default',
          [OPERATION_ANNOTATIONS.ENABLED]:       'false'
        },
        dayTwoOpsGlobalSetting: true,
      });

      expect(wrapper.vm.dayTwoOpsEnabled).toBe(false);
    });

    it('should fall back to the global day two ops setting when no annotation is present', () => {
      const wrapper = mountDayTwoOpsWrapper({ dayTwoOpsGlobalSetting: true });

      expect(wrapper.vm.dayTwoOpsEnabled).toBe(true);
    });

    it('should persist the day two ops selection as a string annotation', () => {
      const wrapper = mountDayTwoOpsWrapper();

      wrapper.vm.dayTwoOpsEnabled = true;
      expect(wrapper.vm.normanCluster.annotations[OPERATION_ANNOTATIONS.ENABLED]).toBe('true');

      wrapper.vm.dayTwoOpsEnabled = false;
      expect(wrapper.vm.normanCluster.annotations[OPERATION_ANNOTATIONS.ENABLED]).toBe('false');
    });

    it('should initialize day two ops from feature and global settings in create mode', async() => {
      const managementById = jest.fn().mockReturnValue({ value: 'true' });
      const dispatch = jest.fn().mockResolvedValue({ enabled: true });
      const wrapper = mountDayTwoOpsWrapper({
        mode:  _CREATE,
        value: {
          isLocal: false,
          isRke1:  false,
        },
        managementById,
        dispatch,
      });

      await wrapper.vm.initDayTwoOps();

      expect(dispatch).toHaveBeenCalledWith('management/find', {
        type: MANAGEMENT.FEATURE,
        id:   'imported-day-2-ops'
      });
      expect(wrapper.vm.dayTwoOpsFlagEnabled).toBe(true);
      expect(wrapper.vm.dayTwoOpsGlobalSetting).toBe(true);
      expect(wrapper.vm.normanCluster.annotations[OPERATION_ANNOTATIONS.ENABLED]).toBe('true');
    });
  });
});
