import { shallowMount } from '@vue/test-utils';
import AgentConfiguration from '@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration.vue';
import { AGENT_CONFIGURATION_TYPES } from '@shell/config/settings';
import { _CREATE } from '@shell/config/query-params';

const createWrapper = (propsData: any = {}) => {
  return shallowMount(AgentConfiguration, {
    propsData: {
      mode:  _CREATE,
      type:  AGENT_CONFIGURATION_TYPES.CLUSTER,
      value: {},
      ...propsData
    },
    global: {
      mocks: {
        $store: {
          getters:  { 'i18n/t': (key: string) => key },
          dispatch: jest.fn().mockResolvedValue([]),
        },
        t: (key: string) => key
      }
    }
  });
};

describe('component: AgentConfiguration', () => {
  describe('nested section styling', () => {
    it('should default the nested Pod/Node Affinity sections to the opposite of the default section type and background', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.sectionType).toBe('primary');
      expect(wrapper.vm.sectionBackground).toBe('secondary');
      expect(wrapper.vm.nestedSectionType).toBe('secondary');
      expect(wrapper.vm.nestedSectionBackground).toBe('primary');
    });

    it('should flip the nested Pod/Node Affinity sections when the parent section type and background are overridden', () => {
      const wrapper = createWrapper({ sectionType: 'secondary', sectionBackground: 'primary' });

      expect(wrapper.vm.nestedSectionType).toBe('primary');
      expect(wrapper.vm.nestedSectionBackground).toBe('secondary');
    });
  });
});
