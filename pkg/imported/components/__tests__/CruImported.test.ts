import { shallowMount } from '@vue/test-utils';
import CruImported from '@pkg/imported/components/CruImported.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { IMPORTED_CLUSTER_VERSION_MANAGEMENT, OPERATION_ANNOTATIONS } from '@shell/config/labels-annotations';
import { MANAGEMENT } from '@shell/config/types';
import { DAY_2_OPS_DEFAULT } from '@pkg/imported/util/shared.ts';
import { SETTING } from '@shell/config/settings';
import { IMPORTED_DAY_2_OPS } from '@shell/config/features';

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

  describe('day two ops', () => {
    it('should return default day two ops value when annotation is not set', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup
      });

      delete wrapper.vm.normanCluster.annotations[OPERATION_ANNOTATIONS.ENABLED];

      expect(wrapper.vm.dayTwoOps).toBe(DAY_2_OPS_DEFAULT);
    });

    it('should return annotation value when day two ops annotation is set', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup
      });

      wrapper.vm.normanCluster.annotations[OPERATION_ANNOTATIONS.ENABLED] = 'true';

      expect(wrapper.vm.dayTwoOps).toBe('true');
    });

    it('should set day two ops annotation', () => {
      const wrapper = shallowMount(CruImported, {
        propsData: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup
      });

      wrapper.vm.dayTwoOps = 'false';

      expect(wrapper.vm.normanCluster.annotations[OPERATION_ANNOTATIONS.ENABLED]).toBe('false');
    });

    it('should initialize day two ops settings from feature and global setting', async() => {
      const dispatch = jest.fn().mockResolvedValue({ enabled: true });
      const byId = jest.fn().mockReturnValue({ value: 'true' });
      const wrapper = shallowMount(CruImported, {
        ...defaultSetup,
        propsData: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: {
              ...defaultSetup.global.mocks.$store,
              dispatch,
              getters: {
                ...defaultSetup.global.mocks.$store.getters,
                'management/byId': byId,
              }
            }
          }
        },
      });

      wrapper.vm.normanCluster.annotations[OPERATION_ANNOTATIONS.ENABLED] = 'true';

      await wrapper.vm.initDayTwoOps();

      expect(dispatch).toHaveBeenCalledWith('management/find', {
        type: MANAGEMENT.FEATURE,
        id:   IMPORTED_DAY_2_OPS
      });
      expect(byId).toHaveBeenCalledWith(MANAGEMENT.SETTING, SETTING.IMPORTED_CLUSTER_DAY2_OPS_DEFAULT);
      expect(wrapper.vm.dayTwoOpsFlagEnabled).toBe(true);
      expect(wrapper.vm.dayTwoOpsGlobalSetting).toBe(true);
      expect(wrapper.vm.dayTwoOpsOld).toBe('true');
    });

    it('should set day two ops feature flag to false when feature lookup fails', async() => {
      const dispatch = jest.fn().mockRejectedValue(new Error('not found'));
      const wrapper = shallowMount(CruImported, {
        ...defaultSetup,
        propsData: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        global: {
          ...defaultSetup.global,
          mocks: {
            ...defaultSetup.global.mocks,
            $store: {
              ...defaultSetup.global.mocks.$store,
              dispatch,
              getters: {
                ...defaultSetup.global.mocks.$store.getters,
                'management/byId': () => ({ value: 'false' }),
              }
            }
          }
        },
      });

      await wrapper.vm.initDayTwoOps();

      expect(wrapper.vm.dayTwoOpsFlagEnabled).toBe(false);
      expect(wrapper.vm.dayTwoOpsGlobalSetting).toBe(false);
      expect(wrapper.vm.dayTwoOpsOld).toBe(DAY_2_OPS_DEFAULT);
    });
  });
});
