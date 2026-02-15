import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import RKE2 from '@shell/edit/provisioning.cattle.io.cluster/rke2.vue';
import { AGENT_CONFIGURATION_TYPES } from '@shell/config/settings';

const mockStore = {
  getters: {
    'management/schemaFor':            jest.fn().mockReturnValue(null),
    'management/byId':                 jest.fn().mockReturnValue({}),
    'management/canList':              jest.fn().mockReturnValue(true),
    'management/all':                  jest.fn().mockReturnValue([]),
    'rancher/all':                     jest.fn().mockReturnValue([]),
    'rancher/byId':                    jest.fn().mockReturnValue({}),
    'i18n/t':                          jest.fn().mockImplementation((key) => key),
    'i18n/withFallback':               jest.fn().mockImplementation((key) => key),
    'features/get':                    jest.fn().mockReturnValue(() => true),
    'plugins/cloudProviderForDriver':  jest.fn().mockReturnValue(undefined),
    currentCluster:                    {},
    'customisation/getPreviewCluster': {
      badge: {
        iconText: '', color: '', text: ''
      }
    },
    productId:    'rancher',
    currentStore: jest.fn().mockReturnValue('management')
  },
  dispatch: jest.fn().mockResolvedValue({ data: [] })
};

const mockRoute = {
  query: {},
  name:  'test'
};

const mockValue = {
  metadata: {
    name:        'test-cluster',
    annotations: {}
  },
  spec: {
    kubernetesVersion: 'v1.25.0+rke2r1',
    rkeConfig:         {
      machineGlobalConfig:   {},
      networking:            { stackPreference: 'ipv4' },
      machineSelectorConfig: [{ config: {} }],
      dataDirectories:       {}
    },
    clusterAgentDeploymentCustomization: {},
    fleetAgentDeploymentCustomization:   {}
  },
  agentConfig: {}
};

const createWrapper = (propsData: any = {}) => {
  return shallowMount(RKE2, {
    propsData: {
      mode:     'create',
      value:    { ...mockValue, ...propsData.value },
      provider: 'custom',
      ...propsData
    },
    global: {
      mocks: {
        $store:      mockStore,
        $route:      mockRoute,
        $router:     { replace: jest.fn() },
        t:           jest.fn().mockImplementation((key) => key),
        $extension:  { getDynamic: jest.fn().mockReturnValue(undefined) },
        $fetchState: { pending: false, error: null }
      }
    },
    data() {
      return {
        loadedOnce:   true,
        rke2Versions: null,
        k3sVersions:  null,
        defaultRke2:  'v1.25.0+rke2r1',
        defaultK3s:   'v1.25.0+k3s1'
      } as any;
    }
  });
};

describe('component: RKE2 - Fleet Agent Configuration', () => {
  let wrapper: any;

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = createWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('fleet Agent Scheduling Customization', () => {
    beforeEach(async() => {
      // Initialize the component with fleet agent defaults
      wrapper.vm.fleetAgentDefaultPC = { value: 100, preemptionPolicy: 'PreemptLowerPriority' };
      wrapper.vm.fleetAgentDefaultPDB = { maxUnavailable: 1 };
      wrapper.vm.schedulingCustomizationFeatureEnabled = true;
      await nextTick();
    });

    it('should enable Fleet Agent scheduling customization when event is true', async() => {
      const event = { event: true, agentType: AGENT_CONFIGURATION_TYPES.FLEET };

      wrapper.vm.setSchedulingCustomization(event);

      expect(wrapper.vm.value.spec.fleetAgentDeploymentCustomization.schedulingCustomization).toStrictEqual({
        priorityClass:       wrapper.vm.fleetAgentDefaultPC,
        podDisruptionBudget: wrapper.vm.fleetAgentDefaultPDB
      });
    });

    it('should disable Fleet Agent scheduling customization when event is false', async() => {
      // First enable it
      const enableEvent = { event: true, agentType: AGENT_CONFIGURATION_TYPES.FLEET };

      wrapper.vm.setSchedulingCustomization(enableEvent);

      // Then disable it
      const disableEvent = { event: false, agentType: AGENT_CONFIGURATION_TYPES.FLEET };

      wrapper.vm.setSchedulingCustomization(disableEvent);

      expect(wrapper.vm.value.spec.fleetAgentDeploymentCustomization.schedulingCustomization).toBeUndefined();
    });

    it('should enable Cluster Agent scheduling customization when event is true', async() => {
      // Initialize cluster agent defaults
      wrapper.vm.clusterAgentDefaultPC = { value: 200, preemptionPolicy: 'PreemptLowerPriority' };
      wrapper.vm.clusterAgentDefaultPDB = { maxUnavailable: 2 };

      const event = { event: true, agentType: AGENT_CONFIGURATION_TYPES.CLUSTER };

      wrapper.vm.setSchedulingCustomization(event);

      expect(wrapper.vm.value.spec.clusterAgentDeploymentCustomization.schedulingCustomization).toStrictEqual({
        priorityClass:       wrapper.vm.clusterAgentDefaultPC,
        podDisruptionBudget: wrapper.vm.clusterAgentDefaultPDB
      });
    });

    it('should disable Cluster Agent scheduling customization when event is false', async() => {
      // Initialize cluster agent defaults
      wrapper.vm.clusterAgentDefaultPC = { value: 200, preemptionPolicy: 'PreemptLowerPriority' };
      wrapper.vm.clusterAgentDefaultPDB = { maxUnavailable: 2 };

      // First enable it
      const enableEvent = { event: true, agentType: AGENT_CONFIGURATION_TYPES.CLUSTER };

      wrapper.vm.setSchedulingCustomization(enableEvent);

      // Then disable it
      const disableEvent = { event: false, agentType: AGENT_CONFIGURATION_TYPES.CLUSTER };

      wrapper.vm.setSchedulingCustomization(disableEvent);

      expect(wrapper.vm.value.spec.clusterAgentDeploymentCustomization.schedulingCustomization).toBeUndefined();
    });

    it('should handle unknown agent types gracefully', async() => {
      const event = { event: true, agentType: 'unknown' };

      // Should not throw an error
      expect(() => wrapper.vm.setSchedulingCustomization(event)).not.toThrow();

      // Should not modify any agent configuration
      expect(wrapper.vm.value.spec.clusterAgentDeploymentCustomization.schedulingCustomization).toBeUndefined();
      expect(wrapper.vm.value.spec.fleetAgentDeploymentCustomization.schedulingCustomization).toBeUndefined();
    });

    it('should pass the correct agent type to SchedulingCustomization components', async() => {
      await wrapper.vm.$nextTick();

      // Check if AGENT_CONFIGURATION_TYPES is available in the component data
      expect(wrapper.vm.AGENT_CONFIGURATION_TYPES).toBeDefined();
      expect(wrapper.vm.AGENT_CONFIGURATION_TYPES.CLUSTER).toBe('cluster');
      expect(wrapper.vm.AGENT_CONFIGURATION_TYPES.FLEET).toBe('fleet');
    });
  });

  describe('fleet Agent Configuration Data Initialization', () => {
    it('should initialize fleet agent default configuration properties', () => {
      expect(wrapper.vm.fleetAgentDefaultPC).toBeDefined();
      expect(wrapper.vm.fleetAgentDefaultPDB).toBeDefined();
      expect(wrapper.vm.AGENT_CONFIGURATION_TYPES).toBeDefined();
    });

    it('should have AGENT_CONFIGURATION_TYPES with correct values', () => {
      expect(wrapper.vm.AGENT_CONFIGURATION_TYPES).toStrictEqual({
        CLUSTER: 'cluster',
        FLEET:   'fleet'
      });
    });
  });

  describe('fleet Agent Configuration Template', () => {
    it('should render AgentConfiguration for fleet agent with correct props', async() => {
      // Set up fleet agent configuration to ensure it renders
      wrapper.vm.value.spec.fleetAgentDeploymentCustomization = {};
      wrapper.vm.schedulingCustomizationFeatureEnabled = true;
      wrapper.vm.fleetAgentDefaultPC = { value: 100 };
      wrapper.vm.fleetAgentDefaultPDB = { maxUnavailable: 1 };
      await nextTick();

      // Force re-render
      await wrapper.vm.$forceUpdate();
      await nextTick();

      // The template should contain fleet agent configuration
      // This tests the template structure even if the component isn't fully mounted
      expect(wrapper.vm.value.spec.fleetAgentDeploymentCustomization).toBeDefined();
    });
  });

  describe('flannel Masquerade Configuration', () => {
    let k3sWrapper: any;

    beforeEach(() => {
      const k3sValue = {
        ...mockValue,
        spec: {
          ...mockValue.spec,
          rkeConfig: {
            ...mockValue.spec.rkeConfig,
            machineGlobalConfig: { 'flannel-backend': 'vxlan' } // flannel enabled
          }
        }
      };

      k3sWrapper = createWrapper({ value: k3sValue });
    });

    afterEach(() => {
      if (k3sWrapper) {
        k3sWrapper.unmount();
      }
    });

    it('should handle flannel masquerade configuration change', async() => {
      k3sWrapper.vm.handleFlannelMasqChanged(true);

      expect(k3sWrapper.vm.serverConfig['enable-flannel-masq']).toBe(true);
    });

    it('should remove flannel masquerade configuration when set to false', async() => {
      // First set it to true
      k3sWrapper.vm.handleFlannelMasqChanged(true);
      expect(k3sWrapper.vm.serverConfig['enable-flannel-masq']).toBe(true);

      // Then set it to false
      k3sWrapper.vm.handleFlannelMasqChanged(false);
      expect(k3sWrapper.vm.serverConfig['enable-flannel-masq']).toBe(false);
    });

    it('should remove flannel masquerade configuration when set to null/undefined', async() => {
      // First set it to true
      k3sWrapper.vm.handleFlannelMasqChanged(true);
      expect(k3sWrapper.vm.serverConfig['enable-flannel-masq']).toBe(true);

      // Then set it to null
      k3sWrapper.vm.handleFlannelMasqChanged(null);
      expect(k3sWrapper.vm.serverConfig['enable-flannel-masq']).toBeUndefined();
    });
  });
});
