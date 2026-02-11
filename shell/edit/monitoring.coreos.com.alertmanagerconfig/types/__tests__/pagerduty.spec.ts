import { shallowMount } from '@vue/test-utils';
import PagerDuty from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pagerduty.vue';
import { Checkbox } from '@components/Form/Checkbox';

describe('component: PagerDuty.vue', () => {
  const defaultProps = {
    mode:      'edit',
    value:     {},
    namespace: 'test-namespace'
  };

  it('should render correctly with initial props', () => {
    const wrapper = shallowMount(PagerDuty, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const headings = wrapper.findAll('h3');

    expect(headings[0].text()).toBe('Target');

    expect(wrapper.findComponent({ name: 'LabeledSelect' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'SimpleSecretSelector' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'LabeledInput' }).exists()).toBe(true);
    expect(wrapper.findComponent(Checkbox).exists()).toBe(true);
  });

  it('should show routing key selector for "Events API v2"', () => {
    const wrapper = shallowMount(PagerDuty, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    const selector = wrapper.findComponent({ name: 'SimpleSecretSelector' });

    expect(selector.props('secretNameLabel')).toContain('monitoring.alertmanagerConfig.pagerDuty.routingKey');
  });

  it('should show service key selector for "Prometheus"', async() => {
    const wrapper = shallowMount(PagerDuty, {
      props:  { ...defaultProps, value: { serviceKey: { name: 's', key: 'k' } } },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    const selector = wrapper.findComponent({ name: 'SimpleSecretSelector' });

    expect(selector.props('secretNameLabel')).toContain('monitoring.alertmanagerConfig.pagerDuty.serviceKey');
  });

  it('should clear other key when integration type changes', async() => {
    const wrapper = shallowMount(PagerDuty, {
      props:  { ...defaultProps, value: { routingKey: { name: 'r', key: 'k' } } },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    wrapper.vm.integrationType = 'Prometheus';
    await wrapper.vm.$nextTick();

    expect(wrapper.props('value').routingKey).toBeNull();
  });

  it('should update routing key secret', async() => {
    const wrapper = shallowMount(PagerDuty, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const secretSelector = wrapper.findComponent({ name: 'SimpleSecretSelector' });

    await secretSelector.vm.$emit('updateSecretName', 'routing-name');
    await secretSelector.vm.$emit('updateSecretKey', 'routing-key');

    expect(wrapper.props('value').routingKey.name).toBe('routing-name');
    expect(wrapper.props('value').routingKey.key).toBe('routing-key');
  });

  it('should update service key secret', async() => {
    const wrapper = shallowMount(PagerDuty, {
      props:  { ...defaultProps, value: { serviceKey: {} } },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    const secretSelector = wrapper.findComponent({ name: 'SimpleSecretSelector' });

    await secretSelector.vm.$emit('updateSecretName', 'service-name');
    await secretSelector.vm.$emit('updateSecretKey', 'service-key');

    expect(wrapper.props('value').serviceKey.name).toBe('service-name');
    expect(wrapper.props('value').serviceKey.key).toBe('service-key');
  });

  it('should update proxy URL', async() => {
    const wrapper = shallowMount(PagerDuty, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    const labeledInput = wrapper.findComponent({ name: 'LabeledInput' });

    await labeledInput.vm.$emit('update:value', 'http://proxy.com');
    expect(wrapper.props('value').httpConfig.proxyURL).toBe('http://proxy.com');
  });

  it('should toggle send resolved alerts', async() => {
    const wrapper = shallowMount(PagerDuty, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    const checkbox = wrapper.findComponent(Checkbox);

    await checkbox.vm.$emit('update:value', false);
    expect(wrapper.props('value').sendResolved).toBe(false);
  });

  it('should render in view mode', () => {
    const wrapper = shallowMount(PagerDuty, {
      props:  { ...defaultProps, mode: 'view' },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    expect(wrapper.findComponent({ name: 'LabeledSelect' }).attributes('mode')).toBe('view');
    expect(wrapper.findComponent({ name: 'SimpleSecretSelector' }).props('disabled')).toBe(true);
    expect(wrapper.findComponent({ name: 'LabeledInput' }).attributes('mode')).toBe('view');
    expect(wrapper.findComponent(Checkbox).attributes('mode')).toBe('view');
  });

  it('should show banner if no namespace is provided', () => {
    const wrapper = shallowMount(PagerDuty, {
      props:  { ...defaultProps, namespace: '' },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    expect(wrapper.findComponent({ name: 'Banner' }).exists()).toBe(true);
  });
});
