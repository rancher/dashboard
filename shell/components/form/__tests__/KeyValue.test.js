import { shallowMount } from '@vue/test-utils';
import KeyValue from '@shell/components/form/KeyValue.vue';

describe('component: shell/form/KeyValue', () => {
  it('should contain valueProtip prop', () => {
    const tip = 'test value protip';
    const wrapper = shallowMount(KeyValue, { propsData: { valueProtip: tip } });

    expect(wrapper.props().valueProtip).toBe(tip);
  });
});
