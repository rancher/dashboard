import { shallowMount } from '@vue/test-utils';
import Auth from '@shell/edit/monitoring.coreos.com.receiver/auth.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

describe('component: Auth', () => {
  const defaultProps = {
    mode:  'create',
    value: {},
  };

  it('should render correctly with default auth type "none"', () => {
    const wrapper = shallowMount(Auth, { props: { ...defaultProps } });

    expect(wrapper.find('h3').text()).toBe('%monitoringReceiver.auth.label%');
    const labeledSelect = wrapper.findComponent(LabeledSelect);

    expect(labeledSelect.exists()).toBe(true);
    expect(wrapper.vm.authType).toBe('none');

    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    expect(labeledInputs).toHaveLength(0);
  });

  it('should initialize with "basic_auth" if value contains it', () => {
    const value = { basic_auth: { username: 'user' } };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });

    expect(wrapper.vm.authType).toBe('basic_auth');
    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    expect(labeledInputs).toHaveLength(2);
  });

  it('should initialize with "bearer_token" if value contains it', () => {
    const value = { bearer_token: 'token' };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });

    expect(wrapper.vm.authType).toBe('bearer_token');
    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    expect(labeledInputs).toHaveLength(1);
  });

  it('should initialize with "bearer_token_file" if value contains it', () => {
    const value = { bearer_token_file: '/path/to/file' };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });

    expect(wrapper.vm.authType).toBe('bearer_token_file');
    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    expect(labeledInputs).toHaveLength(1);
  });

  it('should switch to "basic_auth" and display its inputs', async() => {
    const wrapper = shallowMount(Auth, { props: { ...defaultProps } });

    const labeledSelect = wrapper.findComponent(LabeledSelect);

    await labeledSelect.vm.$emit('update:value', 'basic_auth');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.authType).toBe('basic_auth');
    expect(wrapper.props().value).toHaveProperty('basic_auth');
    expect(wrapper.props().value.basic_auth).toStrictEqual({});

    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    expect(labeledInputs).toHaveLength(2);
    expect(labeledInputs[0].props().label).toBe('%monitoringReceiver.auth.username%');
    expect(labeledInputs[1].props().label).toBe('%monitoringReceiver.auth.password%');
  });

  it('should update basic_auth username and password', async() => {
    const value = { basic_auth: { username: 'initial' } };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });

    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    await labeledInputs[0].vm.$emit('update:value', 'testuser');
    await labeledInputs[1].vm.$emit('update:value', 'testpass');

    expect(wrapper.props().value.basic_auth.username).toBe('testuser');
    expect(wrapper.props().value.basic_auth.password).toBe('testpass');
  });

  it('should switch to "bearer_token" and display its input', async() => {
    const value = { basic_auth: { username: 'user' } };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });

    const labeledSelect = wrapper.findComponent(LabeledSelect);

    await labeledSelect.vm.$emit('update:value', 'bearer_token');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.authType).toBe('bearer_token');
    expect(wrapper.props().value).not.toHaveProperty('basic_auth');
    expect(wrapper.props().value).toHaveProperty('bearer_token');
    expect(wrapper.props().value.bearer_token).toBe('');

    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    expect(labeledInputs).toHaveLength(1);
    expect(labeledInputs[0].props().label).toBe('%monitoringReceiver.auth.bearerToken.label%');
  });

  it('should update bearer_token', async() => {
    const value = { bearer_token: 'initial-token' };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });
    const labeledInput = wrapper.findComponent(LabeledInput);

    await labeledInput.vm.$emit('update:value', 'secret-token');

    expect(wrapper.props().value.bearer_token).toBe('secret-token');
  });

  it('should switch to "bearer_token_file" and display its input', async() => {
    const value = { basic_auth: { username: 'user' } };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });

    const labeledSelect = wrapper.findComponent(LabeledSelect);

    await labeledSelect.vm.$emit('update:value', 'bearer_token_file');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.authType).toBe('bearer_token_file');
    expect(wrapper.props().value).not.toHaveProperty('basic_auth');
    expect(wrapper.props().value).toHaveProperty('bearer_token_file');
    expect(wrapper.props().value.bearer_token_file).toBe('');

    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    expect(labeledInputs).toHaveLength(1);
    expect(labeledInputs[0].props().label).toBe('%monitoringReceiver.auth.bearerTokenFile.label%');
  });

  it('should update bearer_token_file', async() => {
    const value = { bearer_token_file: '/initial/path' };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });
    const labeledInput = wrapper.findComponent(LabeledInput);

    await labeledInput.vm.$emit('update:value', '/path/to/token/file');

    expect(wrapper.props().value.bearer_token_file).toBe('/path/to/token/file');
  });

  it('should switch from a selected auth type back to "none"', async() => {
    const value = { basic_auth: { username: 'user' } };
    const wrapper = shallowMount(Auth, { props: { ...defaultProps, value } });

    expect(wrapper.vm.authType).toBe('basic_auth');

    const labeledSelect = wrapper.findComponent(LabeledSelect);

    await labeledSelect.vm.$emit('update:value', 'none');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.authType).toBe('none');
    expect(wrapper.props().value).not.toHaveProperty('basic_auth');
    const labeledInputs = wrapper.findAllComponents(LabeledInput);

    expect(labeledInputs).toHaveLength(0);
  });
});
