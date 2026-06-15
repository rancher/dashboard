
import { shallowMount } from '@vue/test-utils';
import Slack from '@shell/edit/monitoring.coreos.com.receiver/types/slack.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _CREATE, _EDIT } from '@shell/config/query-params';

describe('component: Slack', () => {
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
    const wrapper = shallowMount(Slack, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkbox = wrapper.findComponent(Checkbox);

    expect(labeledInputs).toHaveLength(3);
    expect(checkbox.exists()).toBe(true);
  });

  it('should pass down the mode prop to child components', () => {
    const wrapper = shallowMount(Slack, {
      props:  requiredProps,
      global: { mocks: mockStore },
    });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);
    const checkbox = wrapper.findComponent(Checkbox);

    labeledInputs.forEach((input) => {
      expect(input.props().mode).toBe(_EDIT);
    });

    expect(checkbox.props().mode).toBe(_EDIT);
  });

  describe('data initialization', () => {
    it('should initialize http_config and send_resolved', () => {
      const value = {};
      const wrapper = shallowMount(Slack, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.props().value.http_config).toBeDefined();
      expect(wrapper.props().value.send_resolved).toBe(false);
    });

    it('should set default text when mode is create', () => {
      const value = {};
      const wrapper = shallowMount(Slack, {
        props: {
          ...requiredProps,
          value,
          mode: _CREATE,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.props().value.text).toBe('{{ template "slack.rancher.text" . }}');
    });

    it('should not set default text when mode is not create', () => {
      const value = {};
      const wrapper = shallowMount(Slack, {
        props: {
          ...requiredProps,
          value,
        },
        global: { mocks: mockStore },
      });

      expect(wrapper.props().value.text).toBeUndefined();
    });
  });
});
