import { shallowMount } from '@vue/test-utils';
import Auth from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/auth.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';

describe('component: Auth.vue', () => {
  const defaultProps = {
    mode:      'edit',
    value:     {},
    namespace: 'test-namespace'
  };

  it('should render correctly with initial props', () => {
    const wrapper = shallowMount(Auth, {
      props:  defaultProps,
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    expect(wrapper.find('h3').text()).toBe('%monitoringReceiver.auth.label%');
    expect(wrapper.findComponent(LabeledSelect).exists()).toBe(true);
  });

  it('should initialize with basic auth type if present', () => {
    const wrapper = shallowMount(Auth, {
      props:  { ...defaultProps, value: { basicAuth: { username: { name: 'test' } } } },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    expect(wrapper.vm.authType).toBe('basicAuth');
    expect(wrapper.findAllComponents(SimpleSecretSelector)).toHaveLength(2);
  });

  it('should initialize with bearer token auth type if present', () => {
    const wrapper = shallowMount(Auth, {
      props:  { ...defaultProps, value: { bearerTokenSecret: { name: 'test' } } },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    expect(wrapper.vm.authType).toBe('bearerTokenSecret');
    expect(wrapper.findAllComponents(SimpleSecretSelector)).toHaveLength(1);
  });

  it('should switch to basic auth and clear other types', async() => {
    const value = { bearerTokenSecret: { name: 'b', key: 'k' } };
    const wrapper = shallowMount(Auth, {
      props:  { ...defaultProps, value },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'basicAuth');
    expect(wrapper.vm.authType).toBe('basicAuth');
    expect(wrapper.props('value').bearerTokenSecret).toBeUndefined();
    expect(wrapper.props('value').basicAuth).toBeDefined();
  });

  it('should switch to bearer token and clear other types', async() => {
    const value = { basicAuth: { username: { name: 'u' } } };
    const wrapper = shallowMount(Auth, {
      props:  { ...defaultProps, value },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'bearerTokenSecret');
    expect(wrapper.vm.authType).toBe('bearerTokenSecret');
    expect(wrapper.props('value').basicAuth).toBeUndefined();
    expect(wrapper.props('value').bearerTokenSecret).toBeDefined();
  });

  it('should switch to none and clear other types', async() => {
    const value = { basicAuth: { username: { name: 'u' } } };
    const wrapper = shallowMount(Auth, {
      props:  { ...defaultProps, value },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'none');
    expect(wrapper.vm.authType).toBe('none');
    expect(wrapper.props('value').basicAuth).toBeUndefined();
  });

  it('should update basic auth username and password', async() => {
    const wrapper = shallowMount(Auth, {
      props:  { ...defaultProps, value: { basicAuth: { username: { name: 'test' } } } },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    await wrapper.vm.$nextTick();

    const selectors = wrapper.findAllComponents(SimpleSecretSelector);
    expect(selectors).toHaveLength(2);

    const usernameSelector = selectors[0];
    const passwordSelector = selectors[1];

    await usernameSelector.vm.$emit('updateSecretName', 'user-secret');
    await usernameSelector.vm.$emit('updateSecretKey', 'user-key');
    await passwordSelector.vm.$emit('updateSecretName', 'pass-secret');
    await passwordSelector.vm.$emit('updateSecretKey', 'pass-key');

    const basicAuth = wrapper.props('value').basicAuth;
    expect(basicAuth.username.name).toBe('user-secret');
    expect(basicAuth.username.key).toBe('user-key');
    expect(basicAuth.password.name).toBe('pass-secret');
    expect(basicAuth.password.key).toBe('pass-key');
  });

  it('should update bearer token secret', async() => {
    const wrapper = shallowMount(Auth, {
      props:  { ...defaultProps, value: { bearerTokenSecret: { name: 'test' } } },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });
    await wrapper.vm.$nextTick();

    const selector = wrapper.findComponent(SimpleSecretSelector);
    expect(selector.exists()).toBe(true);

    await selector.vm.$emit('updateSecretName', 'bearer-name');
    await selector.vm.$emit('updateSecretKey', 'bearer-key');

    const bearerToken = wrapper.props('value').bearerTokenSecret;
    expect(bearerToken.name).toBe('bearer-name');
    expect(bearerToken.key).toBe('bearer-key');
  });

  it('should render in view mode', () => {
    const wrapper = shallowMount(Auth, {
      props:  { mode: 'view', value: { basicAuth: {} }, namespace: 'ns' },
      global: { mocks: { $fetchState: { pending: false, error: null } } }
    });

    expect(wrapper.findComponent(LabeledSelect).attributes('disabled')).toBe('true');
    const selectors = wrapper.findAllComponents(SimpleSecretSelector);
    selectors.forEach((selector) => {
      expect(selector.props('disabled')).toBe(true);
    });
  });
});
