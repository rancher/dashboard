import { shallowMount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import Index from '../index.vue';

describe('shell/edit/monitoring.coreos.com.receiver/index.vue', () => {
  const mockStore = (resourceFields = {}) => ({
    getters: {
      'cluster/schemaFor': jest.fn(() => ({ resourceFields })),
      clusterId:           'c-cluster-123',
      'i18n/t':            (key: string) => key,
    },
    dispatch: jest.fn(),
  });

  // Each *_configs entry is a loose bag of alertmanager fields, and the tests move
  // values between them (smarthost <-> host/port), so they are typed as such rather
  // than being inferred as never[] from the empty literals.
  type ReceiverConfig = Record<string, string | undefined>;

  const baseValue = () => ({
    spec: {
      name:              'test-receiver',
      email_configs:     [] as ReceiverConfig[],
      slack_configs:     [] as ReceiverConfig[],
      webhook_configs:   [] as ReceiverConfig[],
      pagerduty_configs: [] as ReceiverConfig[],
      opsgenie_configs:  [] as ReceiverConfig[],
      victorops_configs: [] as ReceiverConfig[],
      pushover_configs:  [] as ReceiverConfig[],
      wechat_configs:    [] as ReceiverConfig[],
    },
    applyDefaults:      jest.fn(),
    save:               jest.fn(),
    done:               jest.fn(),
    registerBeforeHook: jest.fn(),
    doneRoute:          {},
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mount and initialize data correctly in create mode', () => {
    const value = baseValue();
    const wrapper = shallowMount(Index, {
      props: {
        value,
        mode: 'create'
      },
      global: {
        mocks: {
          $store:      mockStore(value.spec),
          $fetchState: { pending: false },
          $route:      { name: 'test-route' },
        }
      }
    });

    expect(wrapper.vm.suffixYaml).toBe('');
  });

  it('should correctly process email configs with smarthost on edit mode', () => {
    const valueWithSmarthost = baseValue();

    valueWithSmarthost.spec.email_configs = [{ smarthost: 'smtp.example.com:587' }];
    const wrapper = shallowMount(Index, {
      props: {
        value: valueWithSmarthost,
        mode:  _EDIT
      },
      global: {
        mocks: {
          $store:      mockStore(),
          $fetchState: { pending: false },
          $route:      { name: 'test-route' },
        }
      }
    });

    expect(wrapper.vm.value.spec.email_configs[0].host).toBe('smtp.example.com');
    expect(wrapper.vm.value.spec.email_configs[0].port).toBe('587');
    expect(wrapper.vm.value.spec.email_configs[0].smarthost).toBeUndefined();
  });

  it('should call saveOverride which calls save method on success', async() => {
    const wrapper = shallowMount(Index, {
      props: {
        value: baseValue(),
        mode:  _EDIT,
      },
      global: {
        mocks: {
          $store:      mockStore(),
          $fetchState: { pending: false },
          $route:      { name: 'test-route' },
        }
      },
    });

    const spy = jest.spyOn(wrapper.vm, 'save');
    const buttonDone = jest.fn();

    wrapper.vm.saveOverride(buttonDone);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call saveOverride which populates errors on yaml error', async() => {
    const wrapper = shallowMount(Index, {
      props: {
        value: baseValue(),
        mode:  _EDIT,
      },
      global: {
        mocks: {
          $store:      mockStore(),
          $fetchState: { pending: false },
          $route:      { name: 'test-route' },
        }
      },
    });

    const spy = jest.spyOn(wrapper.vm, 'save');

    wrapper.vm.yamlError = 'Invalid YAML';
    const buttonDone = jest.fn();

    wrapper.vm.saveOverride(buttonDone);

    expect(wrapper.vm.errors).toContain('Invalid YAML');
    expect(spy).not.toHaveBeenCalled();
    expect(buttonDone).toHaveBeenCalledWith(false);
  });

  it('should call createSmarthost and update email configs', () => {
    const value = baseValue();

    value.spec.email_configs = [{ host: 'smtp.example.com', port: '587' }];

    const wrapper = shallowMount(Index, {
      props: {
        value,
        mode: _EDIT
      },
      global: {
        mocks: {
          $store:      mockStore(),
          $fetchState: { pending: false },
          $route:      { name: 'test-route' },
        }
      }
    });

    wrapper.vm.createSmarthost();
    expect(value.spec.email_configs[0].smarthost).toBe('smtp.example.com:587');
    expect(value.spec.email_configs[0].host).toBeUndefined();
    expect(value.spec.email_configs[0].port).toBeUndefined();
  });
});
