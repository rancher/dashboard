import { shallowMount } from '@vue/test-utils';
import RcAgentConfiguration from '@shell/edit/provisioning.cattle.io.cluster/tabs/RcAgentConfiguration.vue';
import { AGENT_CONFIGURATION_TYPES } from '@shell/config/settings';
import { _CREATE } from '@shell/config/query-params';
import { SECTION_TYPE } from '@components/RcSection';
import RcSchedulingCustomization from '@shell/components/form/RcSchedulingCustomization.vue';

// The default shallow-mount stubs don't render their default slot, which would hide the content under test
const RcContentGroupStub = {
  name:     'RcContentGroup',
  template: '<div><slot /></div>',
};
const RcSectionStub = {
  name:     'RcSection',
  props:    ['title', 'type', 'mode', 'expandable', 'expanded'],
  template: '<div class="rc-section-stub"><slot /></div>',
};

describe('component: RcAgentConfiguration', () => {
  const mountComponent = (props: Record<string, unknown> = {}) => {
    return shallowMount(RcAgentConfiguration, {
      props: {
        mode:  _CREATE,
        type:  AGENT_CONFIGURATION_TYPES.CLUSTER,
        value: {},
        ...props
      },
      global: {
        mocks: {
          $store: {
            getters:  { 'i18n/t': (key: string) => key },
            dispatch: jest.fn().mockResolvedValue([]),
          },
          $fetchState: { pending: false },
        },
        stubs: { RcContentGroup: RcContentGroupStub, RcSection: RcSectionStub },
      },
    });
  };

  const sectionTitles = (wrapper: ReturnType<typeof mountComponent>) => wrapper.findAllComponents(RcSectionStub).map((s) => s.props('title'));

  it('should wrap its content in an RcContentGroup', () => {
    const wrapper = mountComponent();

    expect(wrapper.findComponent(RcContentGroupStub).exists()).toBe(true);
  });

  it('should render the requests and limits and scheduling customization groups as secondary RcSections', () => {
    const wrapper = mountComponent({ schedulingCustomizationFeatureEnabled: true });

    expect(sectionTitles(wrapper)).toStrictEqual([
      '%cluster.agentConfig.groups.podRequestsAndLimits%',
      '%cluster.agentConfig.groups.schedulingCustomization%',
    ]);
    wrapper.findAllComponents(RcSectionStub).forEach((section) => {
      expect(section.props('type')).toBe(SECTION_TYPE.SECONDARY);
      expect(section.props('mode')).toBe('with-header');
    });
  });

  it('should render the sections collapsed by default', () => {
    const wrapper = mountComponent({ schedulingCustomizationFeatureEnabled: true });
    const sections = wrapper.findAllComponents(RcSectionStub);

    expect(sections).toHaveLength(2);
    sections.forEach((section) => {
      expect(section.props('expandable')).toBe('');
      expect(section.props('expanded')).toBe(false);
    });
  });

  it.each([
    'Tolerations',
    'PodAffinity',
    'NodeAffinity',
  ])('should not render %p', (name) => {
    const wrapper = mountComponent({ value: { appendTolerations: [{ key: 'a' }], overrideAffinity: { nodeAffinity: { requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [] } } } } });

    expect(wrapper.findComponent({ name }).exists()).toBe(false);
  });

  it('should not render a GroupPanel', () => {
    const wrapper = mountComponent();

    expect(wrapper.findComponent({ name: 'GroupPanel' }).exists()).toBe(false);
  });

  it('should render the RcContainerResourceLimit without the gpu limit or help text', () => {
    const wrapper = mountComponent();
    const limits = wrapper.findComponent({ name: 'RcContainerResourceLimit' });

    expect(limits.exists()).toBe(true);
    expect(limits.props('handleGpuLimit')).toBe(false);
    expect(limits.props('showTip')).toBe(false);
  });

  it.each([
    [{ schedulingCustomizationFeatureEnabled: true }, true],
    [{ schedulingCustomizationOriginallyEnabled: true }, true],
    [{}, false],
  ])('given props %p should render the scheduling customization section: %p', (props, expected) => {
    const wrapper = mountComponent(props);

    expect(wrapper.find('[data-testid="agent-config-scheduling-customization"]').exists()).toBe(expected);
    expect(wrapper.findComponent(RcSchedulingCustomization).exists()).toBe(expected);
  });

  it('should pass the agent type to the scheduling customization and re-emit its changes', () => {
    const wrapper = mountComponent({ type: AGENT_CONFIGURATION_TYPES.FLEET, schedulingCustomizationFeatureEnabled: true });
    const scheduling = wrapper.findComponent(RcSchedulingCustomization);

    expect(scheduling.props('type')).toBe(AGENT_CONFIGURATION_TYPES.FLEET);

    scheduling.vm.$emit('scheduling-customization-changed', { event: true, agentType: AGENT_CONFIGURATION_TYPES.FLEET });

    expect(wrapper.emitted('scheduling-customization-changed')).toStrictEqual([[{ event: true, agentType: AGENT_CONFIGURATION_TYPES.FLEET }]]);
  });

  it('should ensure the model structure needed by the form controls', () => {
    const value: Record<string, unknown> = {};

    mountComponent({ value });

    expect(value).toStrictEqual({ overrideResourceRequirements: {} });
  });

  it('should write the requests and limits into overrideResourceRequirements', () => {
    const value: Record<string, any> = {};
    const wrapper = mountComponent({ value });

    wrapper.findComponent({ name: 'RcContainerResourceLimit' }).vm.$emit('update:value', {
      requestsCpu: '100m', requestsMemory: '128Mi', limitsCpu: '1', limitsMemory: '1Gi'
    });

    expect(value.overrideResourceRequirements).toStrictEqual({
      requests: { cpu: '100m', memory: '128Mi' },
      limits:   { cpu: '1', memory: '1Gi' },
    });
  });

  it('should read the requests and limits from overrideResourceRequirements', () => {
    const wrapper = mountComponent({ value: { overrideResourceRequirements: { requests: { cpu: '100m' }, limits: { memory: '1Gi' } } } });

    expect(wrapper.findComponent({ name: 'RcContainerResourceLimit' }).props('value')).toStrictEqual({
      requestsCpu: '100m', requestsMemory: undefined, limitsCpu: undefined, limitsMemory: '1Gi'
    });
  });
});
