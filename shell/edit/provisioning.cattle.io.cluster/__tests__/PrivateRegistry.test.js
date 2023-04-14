import { mount } from '@vue/test-utils';
import PrivateRegistry from '@shell/edit/provisioning.cattle.io.cluster/PrivateRegistry.vue';
import { LabeledInput } from '@components/Form/LabeledInput';

describe('component: PrivateRegistry', () => {
  it('should change spec.systemDefaultRegistry prop', async() => {
    const wrapper = mount(PrivateRegistry, {
      propsData: {
        mode:  'create',
        value: { spec: { systemDefaultRegistry: '' } }
      },
      stubs: { Tab: { template: '<div><slot></slot></div>' } }
    });
    const input = wrapper.findComponent(LabeledInput);

    input.vm.$emit('input', 'exemple.com');
    await input.vm.$nextTick();

    expect(wrapper.props('value')).toStrictEqual({ spec: { systemDefaultRegistry: 'exemple.com' } });
  });
});
