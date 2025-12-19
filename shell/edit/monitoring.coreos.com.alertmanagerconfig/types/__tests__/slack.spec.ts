import { shallowMount } from '@vue/test-utils';
import Slack from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/slack.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _CREATE } from '@shell/config/query-params';

describe('component: Slack.vue', () => {
  const defaultProps = {
    mode:      'edit',
    value:     {},
    namespace: 'test-namespace'
  };

  it('should render correctly with initial props', () => {
    const wrapper = shallowMount(Slack, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const headings = wrapper.findAll('h3');
    expect(headings[0].text()).toBe('Target');

    expect(wrapper.findComponent({ name: 'SimpleSecretSelector' }).exists()).toBe(true);
    expect(wrapper.findAllComponents(LabeledInput)).toHaveLength(2);
    expect(wrapper.findComponent(Checkbox).exists()).toBe(true);
  });

  it('should initialize text template in create mode', () => {
    const wrapper = shallowMount(Slack, {
      props:  { ...defaultProps, mode: _CREATE },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    expect(wrapper.props('value').text).toBe('{{ template "slack.rancher.text" . }}');
  });

  it('should update API URL secret', async() => {
    const wrapper = shallowMount(Slack, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const secretSelector = wrapper.findComponent({ name: 'SimpleSecretSelector' });
    await secretSelector.vm.$emit('updateSecretName', 'my-secret');
    await secretSelector.vm.$emit('updateSecretKey', 'my-key');

    expect(wrapper.props('value').apiURL.name).toBe('my-secret');
    expect(wrapper.props('value').apiURL.key).toBe('my-key');
  });

  it('should update default channel', async() => {
    const wrapper = shallowMount(Slack, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    const channelInput = wrapper.findAllComponents(LabeledInput)[0];
    await channelInput.vm.$emit('update:value', '#my-channel');
    expect(wrapper.props('value').channel).toBe('#my-channel');
  });

  it('should update proxy URL', async() => {
    const wrapper = shallowMount(Slack, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    const proxyInput = wrapper.findAllComponents(LabeledInput)[1];
    await proxyInput.vm.$emit('update:value', 'http://my-proxy.com');
    expect(wrapper.props('value').httpConfig.proxyURL).toBe('http://my-proxy.com');
  });

  it('should toggle send resolved alerts', async() => {
    const wrapper = shallowMount(Slack, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    const checkbox = wrapper.findComponent(Checkbox);
    await checkbox.vm.$emit('update:value', true);
    expect(wrapper.props('value').sendResolved).toBe(true);
  });

  it('should render in view mode', () => {
    const wrapper = shallowMount(Slack, {
      props:  { ...defaultProps, mode: 'view' },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    expect(wrapper.findComponent({ name: 'SimpleSecretSelector' }).props('disabled')).toBe(true);
    const inputs = wrapper.findAllComponents(LabeledInput);
    expect(inputs[0].props('mode')).toBe('view');
    expect(inputs[1].props('mode')).toBe('view');
    expect(wrapper.findComponent(Checkbox).props('mode')).toBe('view');
  });

  it('should show banner if no namespace is provided', () => {
    const wrapper = shallowMount(Slack, {
      props:  { ...defaultProps, namespace: '' },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    expect(wrapper.findComponent({ name: 'Banner' }).exists()).toBe(true);
  });
});
