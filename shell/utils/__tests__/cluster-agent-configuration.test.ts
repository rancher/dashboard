import { AGENT_CONFIGURATION_TYPES, initSchedulingCustomization } from '@shell/utils/cluster';
import { _CREATE, _EDIT } from '@shell/config/query-params';

const mockStore = { dispatch: jest.fn() };

const mockFeatures = jest.fn();

interface MockValue {
  clusterAgentDeploymentCustomization: any;
  fleetAgentDeploymentCustomization: any;
  [key: string]: any;
}

const createMockValue = (overrides = {}): MockValue => ({
  clusterAgentDeploymentCustomization: {},
  fleetAgentDeploymentCustomization:   {},
  ...overrides
});

describe('utils: cluster - Agent Configuration Types and Scheduling Customization', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful store dispatch responses
    mockStore.dispatch.mockImplementation((actionType, actionPayload) => {
      if (actionType === 'management/find' && actionPayload?.id === 'cluster-agent-default-priority-class') {
        return Promise.resolve({ value: JSON.stringify({ value: 100, preemptionPolicy: 'PreemptLowerPriority' }) });
      }
      if (actionType === 'management/find' && actionPayload?.id === 'cluster-agent-default-pod-disruption-budget') {
        return Promise.resolve({ value: JSON.stringify({ maxUnavailable: 1 }) });
      }
      if (actionType === 'management/find' && actionPayload?.id === 'fleet-agent-default-priority-class') {
        return Promise.resolve({ value: JSON.stringify({ value: 99, preemptionPolicy: 'PreemptLowerPriority' }) });
      }
      if (actionType === 'management/find' && actionPayload?.id === 'fleet-agent-default-pod-disruption-budget') {
        return Promise.resolve({ value: JSON.stringify({ maxUnavailable: 2 }) });
      }

      return Promise.resolve({ value: '{}' });
    });
  });

  describe('agent configuration types', () => {
    it('should export correct agent configuration types', () => {
      expect(AGENT_CONFIGURATION_TYPES).toBeDefined();
      expect(AGENT_CONFIGURATION_TYPES.CLUSTER).toBe('cluster');
      expect(AGENT_CONFIGURATION_TYPES.FLEET).toBe('fleet');
    });

    it('should have exactly two agent types', () => {
      const keys = Object.keys(AGENT_CONFIGURATION_TYPES);

      expect(keys).toHaveLength(2);
      expect(keys).toContain('CLUSTER');
      expect(keys).toContain('FLEET');
    });
  });

  describe('initSchedulingCustomization', () => {
    it('should initialize both cluster and fleet agent defaults in CREATE mode', async() => {
      const value = createMockValue();

      mockFeatures.mockReturnValue(true); // Enable scheduling customization feature

      const result = await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(result.clusterAgentDefaultPC).toStrictEqual({ value: 100, preemptionPolicy: 'PreemptLowerPriority' });
      expect(result.clusterAgentDefaultPDB).toStrictEqual({ maxUnavailable: 1 });
      expect(result.fleetAgentDefaultPC).toStrictEqual({ value: 99, preemptionPolicy: 'PreemptLowerPriority' });
      expect(result.fleetAgentDefaultPDB).toStrictEqual({ maxUnavailable: 2 });
      expect(result.schedulingCustomizationFeatureEnabled).toBe(true);
    });

    it('should set cluster agent scheduling customization in CREATE mode when feature enabled', async() => {
      const value = createMockValue();

      mockFeatures.mockReturnValue(true);

      await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(value.clusterAgentDeploymentCustomization.schedulingCustomization).toStrictEqual({
        priorityClass:       { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        podDisruptionBudget: { maxUnavailable: 1 }
      });
    });

    it('should set fleet agent scheduling customization in CREATE mode when feature enabled', async() => {
      const value = createMockValue();

      mockFeatures.mockReturnValue(true);

      await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(value.fleetAgentDeploymentCustomization.schedulingCustomization).toStrictEqual({
        priorityClass:       { value: 99, preemptionPolicy: 'PreemptLowerPriority' },
        podDisruptionBudget: { maxUnavailable: 2 }
      });
    });

    it('should not set scheduling customization when feature is disabled', async() => {
      const value = createMockValue();

      mockFeatures.mockReturnValue(false);

      await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(value.clusterAgentDeploymentCustomization.schedulingCustomization).toBeUndefined();
      expect(value.fleetAgentDeploymentCustomization.schedulingCustomization).toBeUndefined();
    });

    it('should not overwrite existing cluster agent scheduling customization in CREATE mode', async() => {
      const existingClusterConfig = { priorityClass: { value: 200 }, podDisruptionBudget: { maxUnavailable: 2 } };
      const value = createMockValue({ clusterAgentDeploymentCustomization: { schedulingCustomization: existingClusterConfig } });

      mockFeatures.mockReturnValue(true);

      await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(value.clusterAgentDeploymentCustomization.schedulingCustomization).toStrictEqual(existingClusterConfig);
    });

    it('should not overwrite existing fleet agent scheduling customization in CREATE mode', async() => {
      const existingFleetConfig = { priorityClass: { value: 300 }, podDisruptionBudget: { maxUnavailable: 3 } };
      const value = createMockValue({ fleetAgentDeploymentCustomization: { schedulingCustomization: existingFleetConfig } });

      mockFeatures.mockReturnValue(true);

      await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(value.fleetAgentDeploymentCustomization.schedulingCustomization).toStrictEqual(existingFleetConfig);
    });

    it('should detect originally enabled scheduling customization in EDIT mode', async() => {
      const value = createMockValue({ clusterAgentDeploymentCustomization: { schedulingCustomization: { priorityClass: { value: 100 } } } });

      mockFeatures.mockReturnValue(true);

      const result = await initSchedulingCustomization(value, mockFeatures, mockStore, _EDIT);

      expect(result.schedulingCustomizationOriginallyEnabled).toBe(true);
    });

    it('should detect originally enabled scheduling customization for fleet agent in EDIT mode', async() => {
      const value = createMockValue({ fleetAgentDeploymentCustomization: { schedulingCustomization: { priorityClass: { value: 99 } } } });

      mockFeatures.mockReturnValue(true);

      const result = await initSchedulingCustomization(value, mockFeatures, mockStore, _EDIT);

      expect(result.schedulingCustomizationOriginallyEnabled).toBe(true);
    });

    it('should detect originally enabled when either cluster or fleet agent has customization', async() => {
      const value = createMockValue({ fleetAgentDeploymentCustomization: { schedulingCustomization: { priorityClass: { value: 99 } } } });
      // clusterAgentDeploymentCustomization has no schedulingCustomization

      mockFeatures.mockReturnValue(true);

      const result = await initSchedulingCustomization(value, mockFeatures, mockStore, _EDIT);

      expect(result.schedulingCustomizationOriginallyEnabled).toBe(true);
    });

    it('should handle store dispatch errors gracefully', async() => {
      const value = createMockValue();

      mockFeatures.mockReturnValue(true);
      mockStore.dispatch.mockRejectedValue(new Error('Store error'));

      const result = await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(result.errors).toHaveLength(4); // 4 dispatch calls, all failing
      expect(result.clusterAgentDefaultPC).toBeNull();
      expect(result.clusterAgentDefaultPDB).toBeNull();
      expect(result.fleetAgentDefaultPC).toBeNull();
      expect(result.fleetAgentDefaultPDB).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', async() => {
      const value = createMockValue();

      mockFeatures.mockReturnValue(true);
      mockStore.dispatch.mockResolvedValue({ value: 'invalid-json' });

      const result = await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(result.errors).toHaveLength(4); // JSON parsing errors
      expect(result.clusterAgentDefaultPC).toBeNull();
      expect(result.fleetAgentDefaultPC).toBeNull();
    });

    it('should return empty errors array when everything succeeds', async() => {
      const value = createMockValue();

      mockFeatures.mockReturnValue(true);

      const result = await initSchedulingCustomization(value, mockFeatures, mockStore, _CREATE);

      expect(result.errors).toHaveLength(0);
    });
  });
});
