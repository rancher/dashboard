import { shallowMount } from '@vue/test-utils';
import ProvisioningCattleIoCluster from '@shell/detail/provisioning.cattle.io.cluster.vue';
import * as MastheadComposable from '@shell/components/Resource/Detail/Masthead/composable';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

jest.mock('@shell/components/Resource/Detail/Masthead/composable');

describe('view: provisioning.cattle.io.cluster', () => {
  const useDefaultMastheadPropsSpy = jest.spyOn(MastheadComposable, 'useDefaultMastheadProps');

  beforeEach(() => {
    jest.clearAllMocks();

    useDefaultMastheadPropsSpy.mockReturnValue({} as any);
  });

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

  describe('fakeMachines', () => {
    const clusterName = 'my-cluster';
    const poolName = 'pool1';
    const namespace = 'fleet-default';
    const poolFullName = `${ clusterName }-${ poolName }`;

    const wrongTemplate = { metadata: { name: `${ poolFullName }-aaaa1111`, namespace } };
    const correctTemplate = { metadata: { name: `${ poolFullName }-bbbb2222`, namespace } };

    const baseValue = {
      name:        clusterName,
      nameDisplay: clusterName,
      namespace,
      machines:    [],
      spec:        {
        rkeConfig: {
          machinePools: [
            {
              name:             poolName,
              machineConfigRef: { name: `nc-${ poolFullName }-xyz`, kind: 'Amazonec2Config' },
            },
          ],
        },
      },
    };

    it('uses MachineDeployment infrastructureRef to select the correct template for an empty pool', async() => {
      const machineDeployment = {
        metadata: { name: poolFullName, namespace },
        spec:     { template: { spec: { infrastructureRef: { name: correctTemplate.metadata.name } } } },
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value: baseValue },
        global: { mocks },
      });

      await wrapper.setData({
        allMachineDeployments: [machineDeployment],
        machineTemplates:      [wrongTemplate, correctTemplate],
      });

      const [fakeMachine] = wrapper.vm.fakeMachines;

      expect(fakeMachine.pool._template).toStrictEqual(correctTemplate);
    });

    it('returns the first prefix-matching template when no MachineDeployment exists for the pool', async() => {
      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value: baseValue },
        global: { mocks },
      });

      await wrapper.setData({
        allMachineDeployments: [],
        machineTemplates:      [wrongTemplate, correctTemplate],
      });

      const [fakeMachine] = wrapper.vm.fakeMachines;

      expect(fakeMachine.pool._template).toStrictEqual(wrongTemplate);
    });

    it('returns undefined template when MachineDeployment infrastructureRef does not match any template', async() => {
      const machineDeployment = {
        metadata: { name: poolFullName, namespace },
        spec:     { template: { spec: { infrastructureRef: { name: `${ poolFullName }-nonexistent` } } } },
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value: baseValue },
        global: { mocks },
      });

      await wrapper.setData({
        allMachineDeployments: [machineDeployment],
        machineTemplates:      [wrongTemplate, correctTemplate],
      });

      const [fakeMachine] = wrapper.vm.fakeMachines;

      expect(fakeMachine.pool._template).toBeUndefined();
    });

    it('does not include a pool in fakeMachines when it has active machines', async() => {
      const valueWithMachines = {
        ...baseValue,
        machines: [
          {
            metadata: {
              labels: {
                'cluster.x-k8s.io/cluster-name':       clusterName,
                'rke.cattle.io/rke-machine-pool-name': poolName,
              },
            },
            spec: { infrastructureRef: { apiGroup: 'rke-machine.cattle.io', name: `${ poolFullName }-bbbb2222` } },
          },
        ],
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value: valueWithMachines },
        global: { mocks },
      });

      await wrapper.setData({
        allMachineDeployments: [],
        machineTemplates:      [wrongTemplate, correctTemplate],
      });

      expect(wrapper.vm.fakeMachines).toHaveLength(0);
    });
  });

  describe('computed: showLog', () => {
    it('returns true when mgmt has a log link and extDetailTabs.logs is enabled', async() => {
      const value = { mgmt: { hasLink: (link: string) => link === 'log' } };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      await wrapper.setData({ extDetailTabs: { logs: true } });

      expect(wrapper.vm.showLog).toStrictEqual(true);
    });

    it('returns false when mgmt does not have a log link', async() => {
      const value = { mgmt: { hasLink: () => false } };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      await wrapper.setData({ extDetailTabs: { logs: true } });

      expect(wrapper.vm.showLog).toStrictEqual(false);
    });

    it('returns false when mgmt has a log link but extDetailTabs.logs is disabled', async() => {
      const value = { mgmt: { hasLink: (link: string) => link === 'log' } };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      await wrapper.setData({ extDetailTabs: { logs: false } });

      expect(wrapper.vm.showLog).toStrictEqual(false);
    });

    it('returns false when mgmt is undefined', async() => {
      const value = {};

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      expect(wrapper.vm.showLog).toBeFalsy();
    });
  });
});
