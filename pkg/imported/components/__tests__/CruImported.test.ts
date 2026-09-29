import { shallowMount } from '@vue/test-utils';
import CruImported from '@pkg/imported/components/CruImported.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { IMPORTED_CLUSTER_VERSION_MANAGEMENT, OPERATION_ANNOTATIONS } from '@shell/config/labels-annotations';
import { MANAGEMENT } from '@shell/config/types';
import { DAY_2_OPS_DEFAULT } from '@pkg/imported/util/shared';
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
        RcSection:               { template: '<div><slot></slot></div>' },
        Banner:                  true,
        ClusterMembershipEditor: true,
        RcLabelsAndAnnotations:  true,
        Basics:                  true,
        RcACE:                   true,
        Checkbox:                true,
        RcAgentConfiguration:    true,
        RcPrivateRegistry:       true,
        RcKeyValue:              true,
        NameNsDescription:       true,
        Loading:                 true,
        'router-link':           true
      }
    },
    data: () => ({
      normanCluster: {
        name:                     '',
        annotations:              { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' },
        importedConfig:           { privateRegistryURL: null },
        localClusterAuthEndpoint: {}
      }
    })
  };

  // `CruImported.vue` is a plain JS SFC, so the `normanCluster` type vue-tsc infers from its
  // `data()` default has no `annotations` - they are seeded by the `data` override above.
  const normanAnnotations = (wrapper: { vm: { normanCluster: object } }): Record<string, string> => {
    return (wrapper.vm.normanCluster as { annotations: Record<string, string> }).annotations;
  };

  describe('networking tab visibility', () => {
    it('should show the networking tab when not in create mode, not RKE1, and not local', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
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
        props: {
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
        props: {
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
        props: {
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
        props: {
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
        props: {
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
        props: {
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

    it('should not display the RcACE component if cluster is local', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
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

      const ace = wrapper.findComponent({ name: 'RcACE' });

      expect(ace.exists()).toBe(false);
    });
    it('should display the RcACE component if cluster is not local', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
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

      const ace = wrapper.findComponent({ name: 'RcACE' });

      expect(ace.exists()).toBe(true);
    });
  });

  describe('day two ops', () => {
    it('should return default day two ops value when annotation is not set', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup
      });

      delete normanAnnotations(wrapper)[OPERATION_ANNOTATIONS.ENABLED];

      expect(wrapper.vm.dayTwoOps).toBe(DAY_2_OPS_DEFAULT);
    });

    it('should return annotation value when day two ops annotation is set', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup
      });

      normanAnnotations(wrapper)[OPERATION_ANNOTATIONS.ENABLED] = 'true';

      expect(wrapper.vm.dayTwoOps).toBe('true');
    });

    it('should set day two ops annotation', () => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode:  _EDIT,
          value: { isRke1: false, isLocal: false }
        },
        ...defaultSetup
      });

      wrapper.vm.dayTwoOps = 'false';

      expect(normanAnnotations(wrapper)[OPERATION_ANNOTATIONS.ENABLED]).toBe('false');
    });

    it('should initialize day two ops settings from feature and global setting', async() => {
      const dispatch = jest.fn().mockResolvedValue({ enabled: true });
      const byId = jest.fn().mockReturnValue({ value: 'true' });
      const wrapper = shallowMount(CruImported, {
        ...defaultSetup,
        props: {
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

      normanAnnotations(wrapper)[OPERATION_ANNOTATIONS.ENABLED] = 'true';

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
        props: {
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

  describe('advanced section', () => {
    const mountWith = (value: object, mode = _EDIT) => shallowMount(CruImported, {
      props: {
        mode,
        value: {
          id:                'cluster-id',
          isRke1:            false,
          isLocal:           false,
          findNormanCluster: jest.fn().mockResolvedValue({}),
          ...value
        }
      },
      ...defaultSetup,
      data: () => ({
        normanCluster: {
          name:                                '',
          annotations:                         { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' },
          importedConfig:                      { privateRegistryURL: null },
          localClusterAuthEndpoint:            {},
          clusterAgentDeploymentCustomization: {},
          fleetAgentDeploymentCustomization:   {},
        }
      })
    });

    it('should render the registries section inside the advanced section', () => {
      const wrapper = mountWith({});

      const advanced = wrapper.find('[data-testid="advanced-accordion"]');

      expect(advanced.exists()).toBe(true);
      expect(advanced.find('[data-testid="registries-accordion"]').exists()).toBe(true);
      expect(advanced.findComponent({ name: 'RcPrivateRegistry' }).exists()).toBe(true);
    });

    it.each([
      ['cluster-agent-config-accordion', 'cluster'],
      ['fleet-agent-config-accordion', 'fleet'],
    ])('should render the %p section with an RcAgentConfiguration of type %p inside the advanced section', (testId, type) => {
      const wrapper = mountWith({});

      const section = wrapper.find('[data-testid="advanced-accordion"]').find(`[data-testid="${ testId }"]`);

      expect(section.exists()).toBe(true);
      expect(section.findComponent({ name: 'RcAgentConfiguration' }).props('type')).toBe(type);
    });

    it.each([
      ['cluster-agent-config-accordion'],
      ['fleet-agent-config-accordion'],
    ])('should not render the %p section for the local cluster', (testId) => {
      const wrapper = mountWith({ isLocal: true });

      expect(wrapper.find(`[data-testid="${ testId }"]`).exists()).toBe(false);
      expect(wrapper.find('[data-testid="registries-accordion"]').exists()).toBe(true);
    });

    it('should not render the advanced section for RKE1 clusters', () => {
      const wrapper = mountWith({ isRke1: true });

      expect(wrapper.find('[data-testid="advanced-accordion"]').exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'RcAgentConfiguration' }).exists()).toBe(false);
    });
  });

  describe('agent configuration', () => {
    const mountWithCluster = (normanCluster: object, mode = _EDIT) => {
      const wrapper = shallowMount(CruImported, {
        props: {
          mode,
          value: {
            id: 'cluster-id', isRke1: false, isLocal: false, findNormanCluster: jest.fn().mockResolvedValue({})
          }
        },
        ...defaultSetup,
      });

      // Set after mount, so the values the test sets aren't replaced by fetch
      (wrapper.vm as any).normanCluster = {
        name:                     'test',
        annotations:              { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: 'system-default' },
        importedConfig:           {},
        localClusterAuthEndpoint: {},
        save:                     jest.fn().mockResolvedValue({}),
        ...normanCluster,
      };

      return wrapper;
    };

    it('should create empty agent configuration models when they are missing', () => {
      const wrapper = mountWithCluster({});
      const vm = wrapper.vm as any;

      vm.ensureAgentConfiguration();

      expect(vm.normanCluster.clusterAgentDeploymentCustomization).toStrictEqual({});
      expect(vm.normanCluster.fleetAgentDeploymentCustomization).toStrictEqual({});
    });

    it('should keep existing agent configuration models', () => {
      const existing = { overrideResourceRequirements: { limits: { cpu: '1' } } };
      const wrapper = mountWithCluster({ clusterAgentDeploymentCustomization: existing });
      const vm = wrapper.vm as any;

      vm.ensureAgentConfiguration();

      expect(vm.normanCluster.clusterAgentDeploymentCustomization).toStrictEqual(existing);
    });

    it('should remove empty values from the agent configurations before save', () => {
      const wrapper = mountWithCluster({
        clusterAgentDeploymentCustomization: { overrideResourceRequirements: { requests: { cpu: '100m', memory: '128Mi' }, limits: {} } },
        fleetAgentDeploymentCustomization:   {
          overrideResourceRequirements: {},
          schedulingCustomization:      { priorityClass: { value: 1000 }, podDisruptionBudget: {} },
        },
      });
      const vm = wrapper.vm as any;

      vm.agentConfigurationCleanup();

      expect(vm.normanCluster.clusterAgentDeploymentCustomization).toStrictEqual({ overrideResourceRequirements: { requests: { cpu: '100m', memory: '128Mi' } } });
      expect(vm.normanCluster.fleetAgentDeploymentCustomization).toStrictEqual({ schedulingCustomization: { priorityClass: { value: 1000 } } });
    });

    it('should keep tolerations and affinity that were configured outside the form', () => {
      const appendTolerations = [{ key: 'dedicated', operator: 'Exists' }];
      const overrideAffinity = {
        nodeAffinity: {
          requiredDuringSchedulingIgnoredDuringExecution: {
            nodeSelectorTerms: [{
              matchExpressions: [{
                key: 'zone', operator: 'In', values: ['a']
              }]
            }]
          }
        }
      };
      const wrapper = mountWithCluster({
        clusterAgentDeploymentCustomization: {
          appendTolerations, overrideAffinity, overrideResourceRequirements: {}
        },
        fleetAgentDeploymentCustomization: {},
      });
      const vm = wrapper.vm as any;

      vm.agentConfigurationCleanup();

      expect(vm.normanCluster.clusterAgentDeploymentCustomization).toStrictEqual({ appendTolerations, overrideAffinity });
    });

    it('should drop the agent configurations entirely when nothing was configured', () => {
      const wrapper = mountWithCluster({
        clusterAgentDeploymentCustomization: { overrideResourceRequirements: {} },
        fleetAgentDeploymentCustomization:   {},
      });
      const vm = wrapper.vm as any;

      vm.agentConfigurationCleanup();

      expect(vm.normanCluster.clusterAgentDeploymentCustomization).toBeUndefined();
      expect(vm.normanCluster.fleetAgentDeploymentCustomization).toBeUndefined();
    });

    it('should save an edit without replacing when nothing was removed from the agent configurations', async() => {
      const wrapper = mountWithCluster({
        clusterAgentDeploymentCustomization: { overrideResourceRequirements: { limits: { cpu: '1', memory: '1Gi' } } },
        fleetAgentDeploymentCustomization:   {},
      });
      const vm = wrapper.vm as any;

      vm.agentConfigurationOriginal = { clusterAgentDeploymentCustomization: { overrideResourceRequirements: { limits: { cpu: '1' } } } };

      await vm.actuallySave();

      expect(vm.normanCluster.save).toHaveBeenCalledWith({ replace: false });
    });

    it('should save an edit with replace when a value was removed from an agent configuration', async() => {
      const wrapper = mountWithCluster({
        clusterAgentDeploymentCustomization: { overrideResourceRequirements: { limits: {} } },
        fleetAgentDeploymentCustomization:   {},
      });
      const vm = wrapper.vm as any;

      vm.agentConfigurationOriginal = { clusterAgentDeploymentCustomization: { overrideResourceRequirements: { limits: { cpu: '1' } } } };

      await vm.actuallySave();

      expect(vm.normanCluster.clusterAgentDeploymentCustomization).toBeUndefined();
      expect(vm.normanCluster.save).toHaveBeenCalledWith({ replace: true });
    });

    it('should clean the agent configurations before saving a new cluster', async() => {
      const waitForProvisioning = jest.fn().mockResolvedValue({});
      const wrapper = mountWithCluster({
        clusterAgentDeploymentCustomization: { overrideResourceRequirements: { limits: { memory: '256Mi' }, requests: {} } },
        fleetAgentDeploymentCustomization:   { overrideResourceRequirements: {} },
        waitForProvisioning,
      }, _CREATE);
      const vm = wrapper.vm as any;

      await vm.actuallySave();

      expect(vm.normanCluster.clusterAgentDeploymentCustomization).toStrictEqual({ overrideResourceRequirements: { limits: { memory: '256Mi' } } });
      expect(vm.normanCluster.fleetAgentDeploymentCustomization).toBeUndefined();
      expect(vm.normanCluster.save).toHaveBeenCalledWith();
      expect(waitForProvisioning).toHaveBeenCalledWith();
    });
  });
});
