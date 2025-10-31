import { mount, shallowMount } from '@vue/test-utils';
import Networking from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/index.vue';

const mockServerArgs = { disable: {}, cni: { options: [] } };

const defaultGetters = {
  currentStore:           () => 'current_store',
  'management/schemaFor': jest.fn(),
  'current_store/all':    jest.fn(),
  'i18n/t':               jest.fn(),
  'i18n/withFallback':    jest.fn(),
};

const defaultMocks = {
  $route: {
    name:  'anything',
    query: { AS: 'yaml' },
  },
};

const defaultSpec = {
  rkeConfig: {
    etcd: { disableSnapshots: false }, machineGlobalConfig: { cni: 'calico' }, networking: {}
  },
  chartValues:              {},
  localClusterAuthEndpoint: {}
};

describe('component: RKE2Networking', () => {
  it('should show a stack preference dropdown', () => {
    const wrapper = shallowMount(Networking, {
      propsData: {
        mode:            'create',
        value:           { spec: defaultSpec },
        selectedVersion: { serverArgs: mockServerArgs },
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },
      },
    });

    const dropdown = wrapper.findComponent('[data-testid="network-tab-stackpreferences"]');

    expect(dropdown.props('options')).toHaveLength(3);
  });

  it('should show an error when an ipv6 pool is present and the user selects the ipv4-only stack preference when creating a new cluster', async() => {
    const spec = { ...defaultSpec, rkeConfig: { ...defaultSpec.rkeConfig, networking: { stackPreference: 'ipv4' } } };
    const wrapper = mount(Networking, {
      propsData: {
        mode:             'create',
        value:            { spec },
        selectedVersion:  { serverArgs: mockServerArgs },
        hasSomeIpv6Pools: true,
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },
      },
    });

    expect(wrapper.emitted('validationChanged')?.[0]?.[0]).toBe(false);
    expect(wrapper.emitted('validationChanged')).toHaveLength(1);

    spec.rkeConfig.networking.stackPreference = 'ipv6';
    wrapper.setProps({ value: { spec } });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('validationChanged')?.[1]?.[0]).toBe(true);
    expect(wrapper.emitted('validationChanged')).toHaveLength(2);
  });

  it.each([
    ['cluster-cidr', '2001:db8::/48'],
    ['service-cidr', '2001:db8:1::/112'],
  ])('should show an ipv6 warning banner when %p is an ipv6 address', async(field, address) => {
    const spec = { ...defaultSpec } as any;

    spec.rkeConfig.machineGlobalConfig[field] = address;

    const wrapper = shallowMount(Networking, {
      propsData: {
        mode:            'create',
        value:           { spec },
        selectedVersion: { serverArgs: mockServerArgs },
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },
      },
    });

    const banner = wrapper.findComponent('[data-testid="network-tab-ipv6StackPreferenceWarning"]');

    expect(banner.exists()).toBe(true);
  });

  it('should not show an ipv6 warning banner when neither cluster-cidr nor service-cidr are ipv6', async() => {
    const spec = { ...defaultSpec } as any;

    spec.rkeConfig.machineGlobalConfig = {
      cni:            'calico',
      'cluster-cidr': '10.0.0.0/16',
      'service-cidr': '10.0.1.0/16'
    } ;

    const wrapper = shallowMount(Networking, {
      propsData: {
        mode:            'create',
        value:           { spec },
        selectedVersion: { serverArgs: mockServerArgs },
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },
      },
    });

    const banner = wrapper.findComponent('[data-testid="network-tab-ipv6StackPreferenceWarning"]');

    expect(banner.exists()).toBe(false);
  });

  it('should not automatically update stack preference or validate it when editing an existing cluster even if its set to ipv4 and the user appears to have ipv6 pools', async() => {
    const spec = { ...defaultSpec, rkeConfig: { ...defaultSpec.rkeConfig, networking: { stackPreference: 'ipv4' } } };
    const wrapper = mount(Networking, {
      propsData: {
        mode:             'edit',
        value:            { spec },
        selectedVersion:  { serverArgs: mockServerArgs },
        hasSomeIpv6Pools: true,
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('validationChanged')?.[0]?.[0]).toBe(true);
    expect(wrapper.emitted('stack-preference-changed')).toBeUndefined();
  });
});
