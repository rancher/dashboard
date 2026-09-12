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

  describe('machine pool autoscaler controls', () => {
    let dispatch: jest.Mock;

    const autoscalerMocks = (featureEnabled = true) => ({
      ...mocks,
      $store: {
        ...mockStore,
        getters: {
          ...mockStore.getters,
          'features/get': () => featureEnabled,
        },
        dispatch,
      },
    });

    const mountCluster = (featureEnabled = true) => shallowMount(ProvisioningCattleIoCluster, {
      props:  { value: {} },
      global: { mocks: autoscalerMocks(featureEnabled) },
    });

    beforeEach(() => {
      dispatch = jest.fn();
    });

    const machinePool = (overrides: any = {}) => ({
      id:                       'fleet-default/cluster-pool1',
      nameDisplay:              'pool1',
      isAutoscalerEnabled:      false,
      isAutoscalerPaused:       false,
      canPauseResumeAutoscaler: true,
      toggleAutoscalerPause:    jest.fn(() => Promise.resolve({})),
      ...overrides
    });

    describe('showPoolMachineControls', () => {
      const testCases: [string, any, boolean][] = [
        ['a pool the autoscaler does not manage', machinePool(), true],
        ['a pool the autoscaler manages', machinePool({ isAutoscalerEnabled: true }), false],
        ['a paused pool, which the user scales again', machinePool({ isAutoscalerEnabled: true, isAutoscalerPaused: true }), true],
        ['no pool', undefined, false],
      ];

      it.each(testCases)('should be %s -> %s', (_label, pool, expected) => {
        expect(mountCluster().vm.showPoolMachineControls(pool)).toBe(expected);
      });

      it('should scale by hand when the autoscaler feature is off, whatever the pool says', () => {
        expect(mountCluster(false).vm.showPoolMachineControls(machinePool({ isAutoscalerEnabled: true }))).toBe(true);
      });
    });

    describe('showPoolAutoscalerControls', () => {
      it('should show for a pool the autoscaler manages', () => {
        expect(mountCluster().vm.showPoolAutoscalerControls(machinePool({ isAutoscalerEnabled: true }))).toBe(true);
      });

      it('should show for a paused pool, so it can be resumed', () => {
        expect(mountCluster().vm.showPoolAutoscalerControls(machinePool({ isAutoscalerEnabled: true, isAutoscalerPaused: true }))).toBe(true);
      });

      it('should not show for a pool the autoscaler does not manage', () => {
        expect(mountCluster().vm.showPoolAutoscalerControls(machinePool())).toBe(false);
      });

      it('should not show when the autoscaler feature is off', () => {
        expect(mountCluster(false).vm.showPoolAutoscalerControls(machinePool({ isAutoscalerEnabled: true }))).toBe(false);
      });

      it('should not show without a pool', () => {
        expect(mountCluster().vm.showPoolAutoscalerControls(undefined)).toBe(false);
      });
    });

    describe('togglePoolAutoscalerPause', () => {
      it('should hold the control disabled until the save settles, then announce the pause', async() => {
        const wrapper = mountCluster();
        const pool = machinePool({ isAutoscalerEnabled: true });

        const done = wrapper.vm.togglePoolAutoscalerPause(pool);

        expect(wrapper.vm.isAutoscalerPauseSaving(pool)).toBe(true);

        await done;

        expect(pool.toggleAutoscalerPause).toHaveBeenCalledWith();
        expect(wrapper.vm.isAutoscalerPauseSaving(pool)).toBe(false);
        expect(wrapper.vm.autoscalerAnnouncement).toBe('%cluster.machinePool.autoscaler.announce.paused%');
      });

      it('should announce the resume of a paused pool', async() => {
        const wrapper = mountCluster();
        const pool = machinePool({ isAutoscalerEnabled: true, isAutoscalerPaused: true });

        await wrapper.vm.togglePoolAutoscalerPause(pool);

        expect(wrapper.vm.autoscalerAnnouncement).toBe('%cluster.machinePool.autoscaler.announce.resumed%');
      });

      it('should announce a failure, and free the control again', async() => {
        const wrapper = mountCluster();
        const pool = machinePool({ isAutoscalerEnabled: true, toggleAutoscalerPause: jest.fn(() => Promise.reject(new Error('nope'))) });

        await wrapper.vm.togglePoolAutoscalerPause(pool);

        expect(wrapper.vm.autoscalerAnnouncement).toBe('%cluster.machinePool.autoscaler.announce.pauseError%');
        expect(wrapper.vm.isAutoscalerPauseSaving(pool)).toBe(false);
      });

      it('should ignore a second click while the first save is in flight', async() => {
        const wrapper = mountCluster();
        const pool = machinePool({ isAutoscalerEnabled: true });

        const done = wrapper.vm.togglePoolAutoscalerPause(pool);

        await wrapper.vm.togglePoolAutoscalerPause(pool);
        await done;

        expect(pool.toggleAutoscalerPause).toHaveBeenCalledTimes(1);
      });

      it('should do nothing without a pool', async() => {
        const wrapper = mountCluster();

        await wrapper.vm.togglePoolAutoscalerPause(undefined);

        expect(wrapper.vm.autoscalerAnnouncement).toBe('');
      });

      it('should not announce a change the model did not make', async() => {
        const wrapper = mountCluster();
        const pool = machinePool({ isAutoscalerEnabled: true, toggleAutoscalerPause: jest.fn(() => undefined) });

        await wrapper.vm.togglePoolAutoscalerPause(pool);

        expect(wrapper.vm.autoscalerAnnouncement).toBe('');
        expect(wrapper.vm.isAutoscalerPauseSaving(pool)).toBe(false);
      });

      it.each([
        ['down', 'scaleDown'],
        ['up', 'scaleUp'],
      ])('should confirm a resume that would scale the pool %s, rather than resuming it', async(direction, key) => {
        const wrapper = mountCluster();
        const pool = machinePool({
          isAutoscalerEnabled:    true,
          isAutoscalerPaused:     true,
          autoscalerResumeResize: {
            direction, target: 5, count: 10
          }
        });

        await wrapper.vm.togglePoolAutoscalerPause(pool);

        expect(pool.toggleAutoscalerPause).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith('management/promptModal', expect.objectContaining({
          component:      'GenericPrompt',
          componentProps: expect.objectContaining({ body: `%cluster.machinePool.autoscaler.resumePrompt.${ key }%` })
        }));
      });

      it('should resume from the confirmation', async() => {
        const wrapper = mountCluster();
        const pool = machinePool({
          isAutoscalerEnabled:    true,
          isAutoscalerPaused:     true,
          autoscalerResumeResize: {
            direction: 'down', target: 5, count: 10
          }
        });

        await wrapper.vm.togglePoolAutoscalerPause(pool);
        await dispatch.mock.calls[0][1].componentProps.applyAction();

        expect(pool.toggleAutoscalerPause).toHaveBeenCalledWith();
        expect(wrapper.vm.autoscalerAnnouncement).toBe('%cluster.machinePool.autoscaler.announce.resumed%');
      });
    });
  });
});
