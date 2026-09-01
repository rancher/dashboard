
import { shallowMount } from '@vue/test-utils';
import Pagerduty from '@shell/edit/monitoring.coreos.com.receiver/types/pagerduty.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: Pagerduty', () => {
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
    const wrapper = shallowMount(Pagerduty, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkbox = wrapper.findComponent(Checkbox);
    const labeledSelect = wrapper.findComponent(LabeledSelect);

    expect(labeledInputs).toHaveLength(2);
    expect(checkbox.exists()).toBe(true);
    expect(labeledSelect.exists()).toBe(true);
  });

  it('should pass down the mode prop to child components', () => {
    const wrapper = shallowMount(Pagerduty, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkbox = wrapper.findComponent(Checkbox);
    const labeledSelect = wrapper.findComponent(LabeledSelect);

    labeledInputs.forEach((input) => {
      expect(input.props().mode).toBe(_EDIT);
    });

    expect(checkbox.props().mode).toBe(_EDIT);
    expect(labeledSelect.attributes().mode).toBe(_EDIT);
  });

  describe('data initialization', () => {
    it('should initialize http_config and send_resolved', () => {
      const value = {};
      const wrapper = shallowMount(Pagerduty, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.props().value.http_config).toBeDefined();
      expect(wrapper.props().value.send_resolved).toBe(true);
    });

    it.each([
      ['Events API v2', { routing_key: 'test-key' }],
      ['Prometheus', { service_key: 'test-key' }],
      ['Events API v2', {}],
    ])('should set integrationType to %p', (expectedType, value) => {
      const wrapper = shallowMount(Pagerduty, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.vm.integrationType).toBe(expectedType);
    });
  });

  describe('watchers', () => {
    it('should clear old integration key when integrationType changes', async() => {
      const value = { routing_key: 'test-key' };
      const wrapper = shallowMount(Pagerduty, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      wrapper.vm.integrationType = 'Prometheus';

      await wrapper.vm.$nextTick();

      expect(value.routing_key).toBeNull();
    });
  });
});
