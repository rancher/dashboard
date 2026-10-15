import { h } from 'vue';
import { shallowMount } from '@vue/test-utils';
import ProvisioningCattleIoCluster from '@shell/detail/provisioning.cattle.io.cluster.vue';
import * as TitleBarComposables from '@shell/components/Resource/Detail/TitleBar/composables';
import * as MetadataComposables from '@shell/components/Resource/Detail/Metadata/composables';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

jest.mock('@shell/components/Resource/Detail/TitleBar/composables');
jest.mock('@shell/components/Resource/Detail/Metadata/composables');

describe('view: provisioning.cattle.io.cluster', () => {
  const useDefaultTitleBarPropsSpy = jest.spyOn(TitleBarComposables, 'useDefaultTitleBarProps');
  const useDefaultMetadataForLegacyPagesPropsSpy = jest.spyOn(MetadataComposables, 'useDefaultMetadataForLegacyPagesProps');

  beforeEach(() => {
    jest.clearAllMocks();

    useDefaultTitleBarPropsSpy.mockReturnValue({ value: {} } as any);
    useDefaultMetadataForLegacyPagesPropsSpy.mockReturnValue({ value: {} } as any);
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

  describe('machine pool actions', () => {
    const autoscalingPool = (overrides = {}) => ({
      nameDisplay:               'pool1',
      autoscalerRange:           { min: 1, max: 4 },
      isAutoscalerEnabled:       true,
      isAutoscalerManaged:       true,
      isAutoscalerPaused:        false,
      isClusterAutoscalerPaused: false,
      isLastAutoscalingPool:     false,
      canPauseResumeAutoscaler:  true,
      showScalePool:             false,
      toggleAutoscalerPause:     jest.fn().mockResolvedValue(true),
      ...overrides,
    });

    const AUTOSCALING_ENTRY = { autoscalingMinSize: 1, autoscalingMaxSize: 4 };

    const mountWithPool = async(pool: any, featureEnabled = true, machinePools: any[] = [AUTOSCALING_ENTRY]) => {
      const slotStub = {
        render() {
          return h('div', (this as any).$slots.default?.());
        }
      };
      const resourceTableStub = {
        render() {
          return h('div', (this as any).$slots['group-by']?.({ group: { ref: pool } }));
        }
      };

      const commit = jest.fn();
      const tableMocks = {
        ...mocks,
        $store: {
          ...mockStore,
          commit,
          getters: {
            ...mockStore.getters,
            'features/get': () => featureEnabled,
            'i18n/exists':  () => true,
          },
        },
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props: {
          value: {
            isRke2:   true,
            name:     'c1',
            spec:     { rkeConfig: { machinePools } },
            machines: [],
            pools:    [],
            hasLink:  () => true,
          }
        },
        global: {
          mocks: tableMocks,
          stubs: {
            DetailPage: {
              render() {
                return h('div', (this as any).$slots['bottom-area']?.());
              }
            },
            ResourceTabs:  slotStub,
            Tab:           slotStub,
            ResourceTable: resourceTableStub,
          },
        },
      });

      await wrapper.setData({ haveMachines: true, machineTemplates: [] });

      return { wrapper, commit };
    };

    it.each([
      ['a pause toggle for a pool the autoscaler is scaling', { isAutoscalerEnabled: true }, {
        icon: 'icon-pause', disabled: false, scaleDisabled: true
      }],
      ['a resume toggle for a paused pool', { isAutoscalerEnabled: false, isAutoscalerPaused: true }, {
        icon: 'icon-play', disabled: false, scaleDisabled: false
      }],
      ['a disabled resume toggle for a pool with no autoscaler', {
        isAutoscalerEnabled: false, isAutoscalerManaged: false, canPauseResumeAutoscaler: false
      }, {
        icon: 'icon-play', disabled: true, scaleDisabled: false
      }],
      ['a disabled pause toggle while the whole cluster is paused', {
        isAutoscalerEnabled: true, isClusterAutoscalerPaused: true, canPauseResumeAutoscaler: false
      }, {
        icon: 'icon-play', disabled: true, scaleDisabled: true
      }],
    ])('should show %s', async(_label, overrides, expected) => {
      const { wrapper } = await mountWithPool(autoscalingPool({
        ...overrides, showScalePool: true, canScaleUpPool: () => true, canScaleDownPool: () => true
      }));
      const toggle = wrapper.find('[data-testid="autoscaler-toggle-button"]');

      expect(toggle.find('i').classes()).toContain(expected.icon);
      expect(toggle.attributes('aria-disabled')).toStrictEqual(`${ expected.disabled }`);
      expect(toggle.classes('disabled')).toStrictEqual(expected.disabled);
      expect(toggle.attributes('disabled')).toBeUndefined();
      expect(wrapper.find('[data-testid="scale-up-button"]').attributes('disabled')).toStrictEqual(expected.scaleDisabled ? '' : undefined);
    });

    it('should toggle the autoscaler from the row', async() => {
      const pool = autoscalingPool({ isAutoscalerEnabled: true });
      const { wrapper } = await mountWithPool(pool);

      await wrapper.find('[data-testid="autoscaler-toggle-button"]').trigger('click');

      expect(pool.toggleAutoscalerPause).toHaveBeenCalledWith();
    });

    it('should not toggle the autoscaler from a disabled toggle', async() => {
      const pool = autoscalingPool({ isLastAutoscalingPool: true, canPauseResumeAutoscaler: false });
      const { wrapper } = await mountWithPool(pool);

      await wrapper.find('[data-testid="autoscaler-toggle-button"]').trigger('click');

      expect(pool.toggleAutoscalerPause).not.toHaveBeenCalledWith();
    });

    it('should name the toggle of a pool with no autoscaler by why it is disabled', async() => {
      const { wrapper } = await mountWithPool(autoscalingPool({
        isAutoscalerEnabled: false, isAutoscalerManaged: false, canPauseResumeAutoscaler: false
      }));

      expect(wrapper.find('[data-testid="autoscaler-toggle-button"]').attributes('aria-label')).toStrictEqual('%cluster.machinePool.autoscaler.pause.unconfiguredTooltip%');
    });

    it('should keep the scale controls beside the toggle', async() => {
      const { wrapper } = await mountWithPool(autoscalingPool({
        isAutoscalerEnabled: true, showScalePool: true, canScaleUpPool: () => true, canScaleDownPool: () => true
      }));
      const order = wrapper.findAll('.pool-scale-controls > *').map((el) => el.attributes('data-testid'));

      expect(order).toStrictEqual(['scale-down-button', 'scale-up-button', 'autoscaler-toggle-button']);
    });

    it('should not show the toggle while the autoscaler feature flag is off', async() => {
      const { wrapper } = await mountWithPool(autoscalingPool(), false);

      expect(wrapper.find('[data-testid="autoscaler-toggle-button"]').exists()).toBe(false);
    });

    it('should render the row of a pool whose inherited resource actions cannot be built', async() => {
      const pool = autoscalingPool();

      Object.defineProperty(pool, 'availableActions', {
        get() {
          throw new Error('no router');
        }
      });

      const { wrapper } = await mountWithPool(pool);

      expect(wrapper.find('[data-testid="autoscaler-toggle-button"]').exists()).toBe(true);
    });
  });

  describe('setup: customMastheadProps', () => {
    const titleBarProps = {
      resourceTypeLabel: 'Cluster',
      resourceName:      'my-cluster',
      badge:             { color: 'bg-info', label: 'Provisioning State' },
    };
    const metadataProps = { resource: { some: 'resource' } };

    beforeEach(() => {
      useDefaultTitleBarPropsSpy.mockReturnValue({ value: titleBarProps } as any);
      useDefaultMetadataForLegacyPagesPropsSpy.mockReturnValue({ value: metadataProps } as any);
    });

    it('uses the mgmt cluster state for the header badge when mgmt exists', () => {
      const value = {
        stateBackground: 'bg-error',
        stateDisplay:    'Prov Error',
        mgmt:            {
          stateBackground: 'bg-success',
          stateDisplay:    'Active',
        },
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      expect(wrapper.vm.customMastheadProps.titleBarProps.badge).toStrictEqual({
        color: 'bg-success',
        label: 'Active',
      });
    });

    it('falls back to the provisioning cluster state for the header badge when mgmt is undefined', () => {
      const value = {
        stateBackground: 'bg-error',
        stateDisplay:    'Prov Error',
      };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      expect(wrapper.vm.customMastheadProps.titleBarProps.badge).toStrictEqual({
        color: 'bg-error',
        label: 'Prov Error',
      });
    });

    it('preserves the other default title bar props and passes through the metadata props', () => {
      const value = { mgmt: { stateBackground: 'bg-success', stateDisplay: 'Active' } };

      const wrapper = shallowMount(ProvisioningCattleIoCluster, {
        props:  { value },
        global: { mocks },
      });

      const result = wrapper.vm.customMastheadProps;

      expect(result.titleBarProps.resourceTypeLabel).toStrictEqual('Cluster');
      expect(result.titleBarProps.resourceName).toStrictEqual('my-cluster');
      expect(result.metadataProps).toStrictEqual(metadataProps);
    });
  });
});
