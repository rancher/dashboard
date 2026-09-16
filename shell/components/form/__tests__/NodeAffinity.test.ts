import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import NodeAffinity from '@shell/components/form/NodeAffinity.vue';
import { _CREATE } from '@shell/config/query-params';
import { SECTION_TYPE } from '@components/RcSection';

const requiredSetup = () => {
  return { global: { mocks: { $store: { getters: { 'i18n/t': (text: string) => text } } } } };
};

describe('component: NodeAffinity', () => {
  it('should display the weight input when the priority is preferred', () => {
    const nodeAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [{
        preference: { matchExpressions: [] },
        weight:     1
      }],
      requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [{ matchExpressions: [] }] }
    };
    const wrapper = mount(NodeAffinity, { props: { mode: _CREATE, value: nodeAffinity } });

    expect(wrapper.find('[data-testid="node-affinity-weight-index0"]').exists()).toBeTruthy();
    expect(wrapper.find('[data-testid="node-affinity-weight-index1"]').exists()).toBeFalsy();
  });

  it('should display the weight input when the value is cleared', async() => {
    const nodeAffinity = {
      preferredDuringSchedulingIgnoredDuringExecution: [{
        preference: { matchExpressions: [] },
        weight:     1
      }],
    };

    const wrapper = mount(NodeAffinity, { props: { mode: _CREATE, value: nodeAffinity } });

    const weightInput = wrapper.find('[data-testid="node-affinity-weight-index0"]');

    weightInput.setValue('');

    await nextTick();

    expect(wrapper.find('[data-testid="node-affinity-weight-index0"]').exists()).toBeTruthy();
  });

  describe('rcCompatible', () => {
    it('should not render an RcSection when rcCompatible is false', () => {
      const wrapper = mount(NodeAffinity, { props: { mode: _CREATE }, ...requiredSetup() });

      expect(wrapper.findComponent({ name: 'RcSection' }).exists()).toBe(false);
    });

    it('should render the fields inside a nested RcSection with the default title and the secondary type when rcCompatible is true', () => {
      const wrapper = mount(NodeAffinity, { props: { mode: _CREATE, rcCompatible: true }, ...requiredSetup() });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.exists()).toBe(true);
      expect(section.props('type')).toBe(SECTION_TYPE.SECONDARY);
      expect(section.props('title')).toBe('cluster.agentConfig.subGroups.nodeAffinity');
    });

    it('should use a caller-provided title over the default when rcCompatible is true', () => {
      const wrapper = mount(NodeAffinity, {
        props: {
          mode: _CREATE, rcCompatible: true, title: 'Custom Title'
        },
        ...requiredSetup()
      });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.props('title')).toBe('Custom Title');
    });
  });
});
