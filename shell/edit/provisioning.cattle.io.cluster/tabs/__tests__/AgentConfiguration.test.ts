import { shallowMount } from '@vue/test-utils';
import AgentConfiguration from '@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration.vue';
import { AGENT_CONFIGURATION_TYPES } from '@shell/config/settings';
import { _CREATE } from '@shell/config/query-params';
import { SECTION_TYPE } from '@components/RcSection';

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
    it('should use the primary section type for the sections nested directly inside this tab', () => {
      const wrapper = createWrapper({ schedulingCustomizationFeatureEnabled: true });

      expect(wrapper.findComponent({ name: 'ContainerResourceLimit' }).props('sectionType')).toBe(SECTION_TYPE.PRIMARY);
      expect(wrapper.findComponent({ name: 'Tolerations' }).props('sectionType')).toBe(SECTION_TYPE.PRIMARY);
      expect(wrapper.findComponent({ name: 'SchedulingCustomization' }).props('sectionType')).toBe(SECTION_TYPE.PRIMARY);
    });

    it('should use the primary section type for the Pod Affinity RcSection', () => {
      const wrapper = createWrapper();

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.props('type')).toBe(SECTION_TYPE.PRIMARY);
    });
  });
});
