import { shallowMount } from '@vue/test-utils';
import ProvisioningCattleIoCluster from '@shell/detail/provisioning.cattle.io.cluster.vue';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

describe('view: provisioning.cattle.io.cluster', () => {
  const mockStore = {
    getters: {
      'management/canList':      () => true,
      'management/schemaFor':    jest.fn(),
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      workspace:                 jest.fn(),
    },
  };

  const mocks = {
    $store:      mockStore,
    $fetchState: { pending: false },
    $route:      {
      query: { AS: '' },
      name:  {
        endsWith: () => {
          return false;
        },
      },
    },
  };

  describe('registration tab visibility', () => {
    it('a hosted Kubernetes Provider with a private endpoint (network config) and cluster not ready should SHOW the registration tab', async() => {
      const value = {
        isHostedKubernetesProvider: true,
        isPrivateHostedProvider:    true,
        mgmt:                       {
          hasLink: () => jest.fn(),
          linkFor: () => '',
          isReady: false
        }
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      await wrapper.setData({ clusterToken: {} });

      expect(wrapper.vm.showRegistration).toStrictEqual(true);
    });

    it('a hosted Kubernetes Provider WITHOUT a private endpoint (network config) and cluster not ready should NOT SHOW the registration tab', async() => {
      const value = {
        isHostedKubernetesProvider: true,
        mgmt:                       {
          hasLink: () => jest.fn(),
          linkFor: () => '',
          isReady: false
        }
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      await wrapper.setData({ clusterToken: {} });

      expect(wrapper.vm.showRegistration).toStrictEqual(false);
    });

    it('should SHOW if custom/imported cluster and the cluster is active', async() => {
      const value = {
        isCustom:   true,
        isImported: true,
        mgmt:       {
          hasLink: () => jest.fn(),
          linkFor: () => '',
          isReady: true
        }
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      await wrapper.setData({ clusterToken: {} });

      expect(wrapper.vm.showRegistration).toStrictEqual(true);
    });

    it('should NOT show if imported cluster and the cluster is active', async() => {
      const value = {
        isCustom:   false,
        isImported: true,
        mgmt:       {
          hasLink: () => jest.fn(),
          linkFor: () => '',
          isReady: true
        }
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      await wrapper.setData({ clusterToken: {} });

      expect(wrapper.vm.showRegistration).toStrictEqual(false);
    });
  });
});
