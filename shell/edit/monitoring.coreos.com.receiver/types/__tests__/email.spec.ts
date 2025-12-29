
import { shallowMount } from '@vue/test-utils';
import Email from '@shell/edit/monitoring.coreos.com.receiver/types/email.vue';
import TLS from '@shell/edit/monitoring.coreos.com.receiver/tls.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT } from '@shell/config/query-params';

describe('component: Email', () => {
  const mockStore = {
    getters: {
      'i18n/t':      (key: string) => key,
      'i18n/exists': () => true,
    },
  };

  const requiredProps = {
    mode:  _EDIT,
    value: {},
  };

  it('should render all child components', () => {
    const wrapper = shallowMount(Email, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkboxes = wrapper.findAllComponents(Checkbox);
    const tls = wrapper.findComponent(TLS);

    expect(labeledInputs).toHaveLength(6);
    expect(checkboxes).toHaveLength(2);
    expect(tls.exists()).toBe(true);
  });

  it('should pass down the mode prop to child components', () => {
    const wrapper = shallowMount(Email, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkboxes = wrapper.findAllComponents(Checkbox);
    const tls = wrapper.findComponent(TLS);

    labeledInputs.forEach((input) => {
      expect(input.props().mode).toBe(_EDIT);
    });

    checkboxes.forEach((checkbox) => {
      expect(checkbox.props().mode).toBe(_EDIT);
    });

    expect(tls.props().mode).toBe(_EDIT);
  });

  it('should initialize send_resolved and require_tls to false if not present', () => {
    const value = {};
    const wrapper = shallowMount(Email, {
      props: {
        ...requiredProps,
        value,
      },
      global: { mocks: mockStore },
    });

    expect(wrapper.props().value.send_resolved).toBe(false);
    expect(wrapper.props().value.require_tls).toBe(false);
  });

  it('should emit an input event when TLS component emits an update:value event', async() => {
    const wrapper = shallowMount(Email, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const tls = wrapper.findComponent(TLS);
    const updatedValue = { smarthost: 'new-value' };

    await tls.vm.$emit('update:value', updatedValue);

    expect(wrapper.emitted('input')).toHaveLength(1);
    expect(wrapper.emitted('input')?.[0][0]).toStrictEqual(updatedValue);
  });
});
