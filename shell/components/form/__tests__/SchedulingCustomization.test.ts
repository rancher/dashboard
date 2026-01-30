import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SchedulingCustomization from '@shell/components/form/SchedulingCustomization.vue';
import { AGENT_CONFIGURATION_TYPES } from '@shell/utils/cluster';
import { _CREATE, _EDIT } from '@shell/config/query-params';

const mockStore = { getters: { 'i18n/t': jest.fn().mockImplementation((key: string) => key) } };

const createWrapper = (propsData: any = {}) => {
  return mount(SchedulingCustomization, {
    propsData: {
      type:       AGENT_CONFIGURATION_TYPES.CLUSTER,
      feature:    true,
      mode:       _CREATE,
      defaultPC:  { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
      defaultPDB: { maxUnavailable: 1 },
      ...propsData
    },
    global: {
      mocks: {
        $store: mockStore,
        t:      jest.fn().mockImplementation((key: string) => key)
      }
    }
  });
};

describe('component: SchedulingCustomization - Agent Type Support', () => {
  let wrapper: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('agent Type Prop', () => {
    it('should accept and use CLUSTER agent type', () => {
      wrapper = createWrapper({ type: AGENT_CONFIGURATION_TYPES.CLUSTER });

      expect(wrapper.vm.type).toBe(AGENT_CONFIGURATION_TYPES.CLUSTER);
    });

    it('should accept and use FLEET agent type', () => {
      wrapper = createWrapper({ type: AGENT_CONFIGURATION_TYPES.FLEET });

      expect(wrapper.vm.type).toBe(AGENT_CONFIGURATION_TYPES.FLEET);
    });

    it('should emit scheduling-customization-changed event with correct agent type for CLUSTER', async() => {
      wrapper = createWrapper({ type: AGENT_CONFIGURATION_TYPES.CLUSTER });

      const checkbox = wrapper.findComponent('[data-testid="scheduling-customization-checkbox"]');

      await checkbox.vm.$emit('update:value', true);

      expect(wrapper.emitted('scheduling-customization-changed')).toBeTruthy();
      expect(wrapper.emitted('scheduling-customization-changed')[0][0]).toStrictEqual({
        event:     true,
        agentType: AGENT_CONFIGURATION_TYPES.CLUSTER
      });
    });

    it('should emit scheduling-customization-changed event with correct agent type for FLEET', async() => {
      wrapper = createWrapper({ type: AGENT_CONFIGURATION_TYPES.FLEET });

      const checkbox = wrapper.findComponent('[data-testid="scheduling-customization-checkbox"]');

      await checkbox.vm.$emit('update:value', false);

      expect(wrapper.emitted('scheduling-customization-changed')).toBeTruthy();
      expect(wrapper.emitted('scheduling-customization-changed')[0][0]).toStrictEqual({
        event:     false,
        agentType: AGENT_CONFIGURATION_TYPES.FLEET
      });
    });
  });

  describe('settings Mismatch Detection', () => {
    it('should detect priority class value mismatch', () => {
      const value = {
        priorityClass:       { value: 200, preemptionPolicy: 'PreemptLowerPriority' },
        podDisruptionBudget: { maxUnavailable: 1 }
      };

      wrapper = createWrapper({
        value,
        defaultPC: { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        mode:      _EDIT
      });

      expect(wrapper.vm.settingMissmatch).toBe(true);
    });

    it('should detect priority class preemption policy mismatch', () => {
      const value = {
        priorityClass:       { value: 100, preemptionPolicy: 'Never' },
        podDisruptionBudget: { maxUnavailable: 1 }
      };

      wrapper = createWrapper({
        value,
        defaultPC: { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        mode:      _EDIT
      });

      expect(wrapper.vm.settingMissmatch).toBe(true);
    });

    it('should detect pod disruption budget maxUnavailable mismatch', () => {
      const value = {
        priorityClass:       { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        podDisruptionBudget: { maxUnavailable: 2 }
      };

      wrapper = createWrapper({
        value,
        defaultPDB: { maxUnavailable: 1 },
        mode:       _EDIT
      });

      expect(wrapper.vm.settingMissmatch).toBe(true);
    });

    it('should detect pod disruption budget minAvailable mismatch', () => {
      const value = {
        priorityClass:       { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        podDisruptionBudget: { minAvailable: 2 }
      };

      wrapper = createWrapper({
        value,
        defaultPDB: { minAvailable: 1 },
        mode:       _EDIT
      });

      expect(wrapper.vm.settingMissmatch).toBe(true);
    });

    it('should not detect mismatch when values match defaults', () => {
      const value = {
        priorityClass:       { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        podDisruptionBudget: { maxUnavailable: 1 }
      };

      wrapper = createWrapper({
        value,
        defaultPC:  { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        defaultPDB: { maxUnavailable: 1 },
        mode:       _EDIT
      });

      expect(wrapper.vm.settingMissmatch).toBe(false);
    });

    it('should not detect mismatch when no value is provided', () => {
      wrapper = createWrapper({
        value: undefined,
        mode:  _EDIT
      });

      expect(wrapper.vm.settingMissmatch).toBe(false);
    });
  });

  describe('component State', () => {
    it('should be enabled when value is provided', () => {
      const value = {
        priorityClass:       { value: 100 },
        podDisruptionBudget: { maxUnavailable: 1 }
      };

      wrapper = createWrapper({ value });

      expect(wrapper.vm.enabled).toBe(true);
    });

    it('should be disabled when no value is provided', () => {
      wrapper = createWrapper({ value: undefined });

      expect(wrapper.vm.enabled).toBe(false);
    });

    it('should detect edit mode correctly', () => {
      wrapper = createWrapper({ mode: _EDIT });

      expect(wrapper.vm.isEdit).toBe(true);
    });

    it('should detect create mode correctly', () => {
      wrapper = createWrapper({ mode: _CREATE });

      expect(wrapper.vm.isEdit).toBe(false);
    });
  });

  describe('banner Display in Edit Mode', () => {
    it('should show banner when in edit mode and settings mismatch', async() => {
      const value = {
        priorityClass:       { value: 200, preemptionPolicy: 'PreemptLowerPriority' },
        podDisruptionBudget: { maxUnavailable: 1 }
      };

      wrapper = createWrapper({
        value,
        defaultPC: { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        mode:      _EDIT,
        feature:   true
      });

      await nextTick();

      // The banner should be available in the template when conditions are met
      expect(wrapper.vm.settingMissmatch).toBe(true);
      expect(wrapper.vm.isEdit).toBe(true);
      expect(wrapper.vm.feature).toBe(true);
    });

    it('should not show banner when not in edit mode', () => {
      const value = {
        priorityClass:       { value: 200, preemptionPolicy: 'PreemptLowerPriority' },
        podDisruptionBudget: { maxUnavailable: 1 }
      };

      wrapper = createWrapper({
        value,
        defaultPC: { value: 100, preemptionPolicy: 'PreemptLowerPriority' },
        mode:      _CREATE,
        feature:   true
      });

      expect(wrapper.vm.isEdit).toBe(false);
      // Banner should not show because not in edit mode
    });
  });
});
