import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import NodeAffinity from '@shell/components/form/NodeAffinity.vue';
import { _CREATE } from '@shell/config/query-params';

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
});
