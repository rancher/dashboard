import { shallowMount } from '@vue/test-utils';
import IngressClass from '@shell/edit/networking.k8s.io.ingress/IngressClass.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _EDIT } from '@shell/config/query-params';

jest.mock('@shell/components/form/LabeledSelect', () => ({
  name:     'LabeledSelect',
  template: '<div></div>',
  props:    ['value', 'taggable', 'searchable', 'mode', 'label', 'options', 'optionLabel'],
  emits:    ['update:value'],
}));

describe('ingressClass.vue', () => {
  it('renders correctly', () => {
    const wrapper = shallowMount(IngressClass, {
      props: {
        value:          {},
        ingressClasses: [],
        mode:           _EDIT,
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findComponent(LabeledSelect).exists()).toBe(true);
  });

  it('updates ingressClassName correctly', async() => {
    const wrapper = shallowMount(IngressClass, {
      props: {
        value:          {},
        ingressClasses: [{ label: 'nginx', value: 'nginx' }],
        mode:           _EDIT,
      },
    });

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'nginx');

    expect(wrapper.vm.ingressClassName).toBe('nginx');
    expect(wrapper.props('value').spec.ingressClassName).toBe('nginx');
    expect(wrapper.emitted()['update:value']).toBeTruthy();
  });

  it('removes ingressClassName when none is selected', async() => {
    const wrapper = shallowMount(IngressClass, {
      props: {
        value:          { spec: { ingressClassName: 'nginx' } },
        ingressClasses: [{ label: 'nginx', value: 'nginx' }],
        mode:           _EDIT,
      },
    });

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', '');

    expect(wrapper.vm.ingressClassName).toBe('');
    expect(wrapper.props('value').spec.ingressClassName).toBeUndefined();
    expect(wrapper.emitted()['update:value']).toBeTruthy();
  });
});
