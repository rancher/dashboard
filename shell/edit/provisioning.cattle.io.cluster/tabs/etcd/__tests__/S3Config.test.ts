import { shallowMount } from '@vue/test-utils';
import S3Config from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/S3Config.vue';

describe('s3Config', () => {
  const defaultProps = {
    mode:                'create',
    namespace:           'test-ns',
    registerBeforeHook:  jest.fn(),
    localRetentionCount: 5,
    value:               {}
  };

  const mockStore = { getters: { 'rancher/byId': jest.fn() } };

  const createWrapper = (props = {}) => {
    return shallowMount(S3Config, {
      propsData: {
        ...defaultProps,
        ...props
      },
      mocks: {
        $store: mockStore,
        t:      (key) => key,
      },
      stubs: {
        LabeledInput:             true,
        Checkbox:                 true,
        SelectOrCreateAuthSecret: true,
        UnitInput:                true,
        RadioGroup:               true,
      }
    });
  };

  it('renders correctly', () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
  });

  it('initializes config with default values', () => {
    const wrapper = createWrapper();

    expect(wrapper.vm.config.bucket).toBe('');
    expect(wrapper.vm.config.skipSSLVerify).toBe(false);
  });

  it('initializes config with provided value prop', () => {
    const value = {
      bucket:    'test',
      region:    'us-east-1',
      retention: 2
    };
    const wrapper = createWrapper({ value });

    expect(wrapper.vm.config.bucket).toBe('test');
    expect(wrapper.vm.config.region).toBe('us-east-1');
    expect(wrapper.vm.config.retention).toBe(2);
  });

  describe('retention Logic', () => {
    it('computes localCountToUse correctly', () => {
      const wrapper = createWrapper({ localRetentionCount: 3 });

      expect(wrapper.vm.localCountToUse).toBe(3);
    });

    it('uses default retention if localRetentionCount is null', () => {
      const wrapper = createWrapper({ localRetentionCount: null });

      expect(wrapper.vm.localCountToUse).toBe(5);
    });

    it('sets differentRetention to false in create mode', () => {
      const wrapper = createWrapper({ mode: 'create' });

      expect(wrapper.vm.differentRetention).toBe(false);
    });

    it('sets differentRetention to false in edit mode if retention matches', () => {
      const wrapper = createWrapper({
        mode:                'edit',
        value:               { retention: 5 },
        localRetentionCount: 5
      });

      expect(wrapper.vm.differentRetention).toBe(false);
    });

    it('sets differentRetention to true in edit mode if retention differs', () => {
      const wrapper = createWrapper({
        mode:                'edit',
        value:               { retention: 2 },
        localRetentionCount: 5
      });

      expect(wrapper.vm.differentRetention).toBe(true);
    });

    it('updates retention when localRetentionCount changes and differentRetention is false', async() => {
      const wrapper = createWrapper({ localRetentionCount: 5 });

      // differentRetention is false by default in create mode
      await wrapper.setProps({ localRetentionCount: 10 });
      expect(wrapper.vm.config.retention).toBe(10);
      expect(wrapper.emitted('update:value')).toBeTruthy();
    });
  });
});
