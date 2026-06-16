import { shallowMount } from '@vue/test-utils';
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

  it('should show a flannel masq input when provisioning k3s and flannel is enabled', () => {
    const spec = { ...defaultSpec } as any;

    const wrapper = shallowMount(Networking, {
      propsData: {
        mode:            'create',
        value:           { spec },
        selectedVersion: { serverArgs: mockServerArgs, label: 'k3s' },
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },
      },
    });

    const input = wrapper.findComponent('[data-testid="cluster-rke2-flannel-masq-checkbox"]');

    expect(input.exists()).toBe(true);
  });

  it('should not show a flannel masq input when provisioning rke2', () => {
    const spec = { ...defaultSpec } as any;

    const wrapper = shallowMount(Networking, {
      propsData: {
        mode:            'create',
        value:           { spec },
        selectedVersion: { serverArgs: mockServerArgs, label: 'rke2' },
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },
      },
    });

    const input = wrapper.findComponent('[data-testid="cluster-rke2-flannel-masq-checkbox"]');

    expect(wrapper.vm.showFlannelMasq).toBe(false);
    expect(input.exists()).toBe(false);
  });
});
