import { nextTick } from 'vue';
import { mount, shallowMount } from '@vue/test-utils';
import Networking from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking/index.vue';

const defaultStubs = {
  // Banner:        true,
  // LabeledSelect: true,
  // YamlEditor:    true,
  // Checkbox:      true
};

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
        stubs: defaultStubs,
      },
    });

    const dropdown = wrapper.findComponent('[data-testid="rke2__networking-stackpreferences"]');

    expect(dropdown.props('options')).toHaveLength(3);
  });

  it('should show an error when an ipv6 pool is present and the user selects the ipv4-only stack preference', async() => {
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
        stubs: defaultStubs,
      },
    });

    let dropdown = wrapper.findComponent('[data-testid="rke2__networking-stackpreferences"]');

    let validationMessage = dropdown.vm.validationMessage;

    expect(validationMessage).toBeUndefined();

    spec.rkeConfig.networking.stackPreference = 'ipv4';
    await nextTick();

    dropdown = wrapper.findComponent('[data-testid="rke2__networking-stackpreferences"]');

    validationMessage = dropdown.vm.rules;

    expect(validationMessage).toBe('s');
  });

  it.each([
    ['cluster-cidr', '2001:db8::/48'],
    ['service-cidr', '2001:db8:1::/112'],
  ])('should show an ipv6 warning banner when %p is an ipv6 address', async(field, address) => {
    const spec = { ...defaultSpec };

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
        stubs: defaultStubs,
      },
    });

    const banner = wrapper.findComponent('[data-testid="rke2__networking-ipv6StackPreferenceWarning"]');

    expect(banner.exists()).toBe(true);
  });
});
