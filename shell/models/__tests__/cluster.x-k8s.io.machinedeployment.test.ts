import CapiMachineDeployment from '@shell/models/cluster.x-k8s.io.machinedeployment';
import { CAPI } from '@shell/config/types';
import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';

const PAUSED_MIN = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MIN_SIZE;
const PAUSED_MAX = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MAX_SIZE;

type MachinePool = {
  name: string,
  quantity?: number,
  autoscalingMinSize?: number,
  autoscalingMaxSize?: number,
  machineDeploymentAnnotations?: { [key: string]: string },
  machineConfigRef: { name: string },
};

const autoscalingPool = (): MachinePool => ({
  name:               'pool1',
  quantity:           1,
  autoscalingMinSize: 1,
  autoscalingMaxSize: 4,
  machineConfigRef:   { name: 'pool1-config' },
});

const pausedPool = (): MachinePool => ({
  name:                         'pool1',
  quantity:                     3,
  machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' },
  machineConfigRef:             { name: 'pool1-config' },
});

const manualPool = (): MachinePool => ({
  name: 'pool2', quantity: 2, machineConfigRef: { name: 'pool2-config' }
});

const createDeployment = ({
  machinePools, canUpdate = true, save = jest.fn(), dispatch = jest.fn(), replicas = 3, clusterPaused = false, featureEnabled = true
}: {
  machinePools: MachinePool[],
  canUpdate?: boolean,
  save?: jest.Mock,
  dispatch?: jest.Mock,
  replicas?: number,
  clusterPaused?: boolean,
  featureEnabled?: boolean,
}) => {
  const cluster = {
    id:                   'ns/c1',
    canUpdate,
    spec:                 { rkeConfig: { machinePools } },
    save,
    isAutoscalerPaused:   clusterPaused,
    loadAutoscalerStatus: jest.fn().mockResolvedValue(undefined),
  };

  const rootGetters = {
    'management/byId': (type: string) => (type === CAPI.RANCHER_CLUSTER ? cluster : undefined),
    'i18n/t':          (key: string) => key,
    'features/get':    () => featureEnabled,
  };

  const deployment = new CapiMachineDeployment({
    id:       'ns/c1-pool1',
    type:     CAPI.MACHINE_DEPLOYMENT,
    metadata: { name: 'c1-pool1', namespace: 'ns' },
    spec:     {
      clusterName: 'c1',
      replicas,
      template:    { spec: { infrastructureRef: { name: 'pool1-config', kind: 'Amazonec2Config' } } },
    },
  }, {
    getters: rootGetters, rootGetters, dispatch
  });

  return {
    deployment, cluster, save, dispatch
  };
};

describe('class CapiMachineDeployment', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('autoscaler state', () => {
    it.each([
      ['an autoscaling pool', autoscalingPool, true, false],
      ['a paused pool', pausedPool, false, true],
      ['a manually scaled pool', () => ({ ...manualPool(), machineConfigRef: { name: 'pool1-config' } }), false, false],
    ])('should report %s', (_label, pool, enabled, paused) => {
      const { deployment } = createDeployment({ machinePools: [pool() as MachinePool] });

      expect(deployment.isAutoscalerEnabled).toStrictEqual(enabled);
      expect(deployment.isAutoscalerPaused).toStrictEqual(paused);
    });

    it('should expose the live range of an autoscaling pool', () => {
      const { deployment } = createDeployment({ machinePools: [autoscalingPool()] });

      expect(deployment.autoscalerRange).toStrictEqual({ min: 1, max: 4 });
    });

    it('should expose the stashed range of a paused pool', () => {
      const { deployment } = createDeployment({ machinePools: [pausedPool()] });

      expect(deployment.autoscalerRange).toStrictEqual({ min: 1, max: 4 });
    });

    it('should not read as paused when the pool carries both live bounds and a stash', () => {
      const pool = { ...autoscalingPool(), machineDeploymentAnnotations: { [PAUSED_MIN]: '9', [PAUSED_MAX]: '9' } };
      const { deployment } = createDeployment({ machinePools: [pool] });

      expect(deployment.isAutoscalerEnabled).toStrictEqual(true);
      expect(deployment.isAutoscalerPaused).toStrictEqual(false);
      expect(deployment.autoscalerRange).toStrictEqual({ min: 1, max: 4 });
    });
  });

  describe('autoscalerStatusKey', () => {
    it.each([
      ['an autoscaling pool', autoscalingPool, false, 'cluster.machinePool.autoscaler.pause.statusAutoscaling'],
      ['a paused pool', pausedPool, false, 'cluster.machinePool.autoscaler.pause.statusPaused'],
      ['an autoscaling pool in a cluster-paused cluster', autoscalingPool, true, 'cluster.machinePool.autoscaler.pause.statusClusterPaused'],
      ['a paused pool in a cluster-paused cluster', pausedPool, true, 'cluster.machinePool.autoscaler.pause.statusClusterPaused'],
      ['a manually scaled pool', manualPool, false, null],
    ])('should describe %s', (_label, pool, clusterPaused, expected) => {
      const { deployment } = createDeployment({ machinePools: [{ ...pool(), machineConfigRef: { name: 'pool1-config' } } as MachinePool], clusterPaused });

      expect(deployment.autoscalerStatusKey).toStrictEqual(expected);
    });
  });

  describe('isLastAutoscalingPool', () => {
    it('should be true when no other pool is autoscaling', () => {
      const { deployment } = createDeployment({ machinePools: [autoscalingPool(), manualPool()] });

      expect(deployment.isLastAutoscalingPool).toStrictEqual(true);
    });

    it('should be false when another pool is autoscaling', () => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment } = createDeployment({ machinePools: [autoscalingPool(), other] });

      expect(deployment.isLastAutoscalingPool).toStrictEqual(false);
    });

    it('should be false for a paused pool', () => {
      const { deployment } = createDeployment({ machinePools: [pausedPool()] });

      expect(deployment.isLastAutoscalingPool).toStrictEqual(false);
    });
  });

  describe('a machine deployment with no provisioning cluster', () => {
    const orphan = () => {
      const rootGetters = {
        'management/byId': () => undefined,
        'i18n/t':          (key: string) => key,
        'features/get':    () => true,
      };

      return new CapiMachineDeployment({
        id:       'ns/standalone',
        type:     CAPI.MACHINE_DEPLOYMENT,
        metadata: { name: 'standalone', namespace: 'ns' },
        spec:     {
          clusterName: 'gone', replicas: 1, template: { spec: { infrastructureRef: { name: 'x', kind: 'Amazonec2Config' } } }
        },
      }, {
        getters: rootGetters, rootGetters, dispatch: jest.fn()
      });
    };

    it('should resolve no pool rather than throwing', () => {
      expect(orphan().inClusterSpec).toBeUndefined();
    });

    it('should offer the resource actions it inherits, with no autoscaler action', () => {
      const deployment: any = orphan();

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(deployment)), '_availableActions', 'get').mockReturnValue([{ action: 'goToEditYaml' }]);

      expect(deployment._availableActions).toStrictEqual([{ action: 'goToEditYaml' }]);

      jest.restoreAllMocks();
    });
  });

  describe('loadAutoscalerDetails', () => {
    const nodeGroup = (overrides = {}) => ({
      name:   'MachineDeployment/ns/c1-pool1',
      health: {
        status:     'Healthy',
        nodeCounts: {
          registered: {
            ready: 4, notStarted: 1, total: 5
          }
        }
      },
      scaleUp:   { lastTransitionTime: '2026-09-24T00:00:00Z' },
      scaleDown: { lastTransitionTime: '2026-09-23T00:00:00Z' },
      ...overrides,
    });

    const withStatus = (status: any, pools = [autoscalingPool()]) => {
      const { deployment, cluster } = createDeployment({ machinePools: pools });

      cluster.loadAutoscalerStatus = jest.fn().mockResolvedValue(status);

      return deployment;
    };

    it('should lead with the pool state and its range', async() => {
      const details = await withStatus('unavailable').loadAutoscalerDetails();

      expect(details).toStrictEqual([
        { label: 'autoscaler.card.details.status', value: 'cluster.machinePool.autoscaler.pause.statusAutoscaling' },
        { label: 'cluster.machinePool.autoscaler.pause.range', value: 'cluster.machinePool.autoscaler.pause.rangeValue' },
      ]);
    });

    it('should report the node group the autoscaler keeps for this pool', async() => {
      const details = await withStatus({ nodeGroups: [nodeGroup()] }).loadAutoscalerDetails();

      expect(details.map((detail: any) => detail.label)).toStrictEqual([
        'autoscaler.card.details.status',
        'cluster.machinePool.autoscaler.pause.range',
        'autoscaler.card.details.health',
        'autoscaler.card.details.scaleDown',
        'autoscaler.card.details.scaleUp',
        'autoscaler.card.details.nodes',
        'autoscaler.card.details.ready',
        'autoscaler.card.details.notStarted',
        'autoscaler.card.details.inTotal',
      ]);
      expect(details[2].value).toStrictEqual({
        component: 'BadgeStateFormatter',
        props:     {
          value: 'Healthy', arbitrary: true, row: {}
        }
      });
      expect(details.slice(-3).map((detail: any) => detail.value)).toStrictEqual([4, 1, 5]);
    });

    it('should ignore the node groups of other pools', async() => {
      const details = await withStatus({ nodeGroups: [nodeGroup({ name: 'MachineDeployment/ns/c1-pool2' })] }).loadAutoscalerDetails();

      expect(details).toHaveLength(2);
    });

    it('should not ask the autoscaler about a paused pool', async() => {
      const { deployment, cluster } = createDeployment({ machinePools: [pausedPool()] });

      cluster.loadAutoscalerStatus = jest.fn();

      const details = await deployment.loadAutoscalerDetails();

      expect(cluster.loadAutoscalerStatus).not.toHaveBeenCalledWith();
      expect(details[0].value).toStrictEqual('cluster.machinePool.autoscaler.pause.statusPaused');
    });
  });

  describe('_availableActions', () => {
    const autoscalerActions = (deployment: any) => {
      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(deployment)), '_availableActions', 'get').mockReturnValue([]);

      return deployment._availableActions.filter((a: any) => a.action === 'toggleAutoscalerPause');
    };

    afterEach(() => jest.restoreAllMocks());

    it('should offer a pause action for an autoscaling pool', () => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment } = createDeployment({ machinePools: [autoscalingPool(), other] });
      const [action] = autoscalerActions(deployment);

      expect(action).toStrictEqual({
        action:  'toggleAutoscalerPause',
        label:   'cluster.machinePool.autoscaler.pause.pauseAction',
        icon:    'icon icon-pause',
        enabled: true,
      });
    });

    it('should offer a resume action for a paused pool', () => {
      const { deployment } = createDeployment({ machinePools: [pausedPool()] });
      const [action] = autoscalerActions(deployment);

      expect(action).toStrictEqual({
        action:  'toggleAutoscalerPause',
        label:   'cluster.machinePool.autoscaler.pause.resumeAction',
        icon:    'icon icon-play',
        enabled: true,
      });
    });

    it('should disable the action for the last autoscaling pool', () => {
      const { deployment } = createDeployment({ machinePools: [autoscalingPool(), manualPool()] });
      const [action] = autoscalerActions(deployment);

      expect(action.enabled).toStrictEqual(false);
    });

    it('should offer no action for a pool that does not autoscale', () => {
      const { deployment } = createDeployment({ machinePools: [autoscalingPool()] });

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(deployment)), '_availableActions', 'get').mockReturnValue([]);
      jest.spyOn(deployment, 'inClusterSpec', 'get').mockReturnValue(manualPool());

      expect(deployment._availableActions).toStrictEqual([]);
    });

    it('should offer no action while the autoscaler feature flag is off', () => {
      const { deployment } = createDeployment({ machinePools: [autoscalingPool()], featureEnabled: false });

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(deployment)), '_availableActions', 'get').mockReturnValue([]);

      expect(deployment._availableActions).toStrictEqual([]);
    });
  });

  describe('canPauseResumeAutoscaler', () => {
    it('should be false without the update permission on the cluster', () => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment } = createDeployment({ machinePools: [autoscalingPool(), other], canUpdate: false });

      expect(deployment.canPauseResumeAutoscaler).toStrictEqual(false);
    });

    it('should be false when the pool has no entry in the cluster spec', () => {
      const { deployment } = createDeployment({ machinePools: [manualPool()] });

      expect(deployment.canPauseResumeAutoscaler).toStrictEqual(false);
    });

    it('should be false for an in-spec pool that neither autoscales nor is paused', () => {
      const pool = {
        ...manualPool(), name: 'pool1', machineConfigRef: { name: 'pool1-config' }
      };
      const { deployment } = createDeployment({ machinePools: [pool] });

      expect(deployment.canPauseResumeAutoscaler).toStrictEqual(false);
    });

    it('should be false for the last autoscaling pool', () => {
      const { deployment } = createDeployment({ machinePools: [autoscalingPool(), manualPool()] });

      expect(deployment.canPauseResumeAutoscaler).toStrictEqual(false);
    });

    it('should be true when another pool is autoscaling', () => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment } = createDeployment({ machinePools: [autoscalingPool(), other] });

      expect(deployment.canPauseResumeAutoscaler).toStrictEqual(true);
    });

    it('should be true for a paused pool so it can be resumed', () => {
      const { deployment } = createDeployment({ machinePools: [pausedPool()] });

      expect(deployment.canPauseResumeAutoscaler).toStrictEqual(true);
    });

    it('should be false while the autoscaler is paused for the whole cluster', () => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment } = createDeployment({ machinePools: [autoscalingPool(), other], clusterPaused: true });

      expect(deployment.canPauseResumeAutoscaler).toStrictEqual(false);
    });
  });

  describe('toggleAutoscalerPause', () => {
    it('should stash the bounds, take the live replica count and save the cluster', async() => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment, cluster, save } = createDeployment({ machinePools: [autoscalingPool(), other], replicas: 3 });

      await deployment.toggleAutoscalerPause();

      expect(save).toHaveBeenCalledWith();
      expect(cluster.spec.rkeConfig.machinePools[0]).toStrictEqual({
        name:                         'pool1',
        quantity:                     3,
        machineConfigRef:             { name: 'pool1-config' },
        machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' },
      });
    });

    it('should restore the stashed bounds and save the cluster', async() => {
      const { deployment, cluster, save } = createDeployment({ machinePools: [pausedPool()] });

      await deployment.toggleAutoscalerPause();

      expect(save).toHaveBeenCalledWith();
      expect(cluster.spec.rkeConfig.machinePools[0]).toStrictEqual({
        name:               'pool1',
        quantity:           3,
        machineConfigRef:   { name: 'pool1-config' },
        autoscalingMinSize: 1,
        autoscalingMaxSize: 4,
      });
    });

    it('should roll the pool back and growl when the save fails', async() => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const save = jest.fn().mockRejectedValue({ status: 500, message: 'nope' });
      const { deployment, cluster, dispatch } = createDeployment({ machinePools: [autoscalingPool(), other], save });

      await deployment.toggleAutoscalerPause();

      expect(cluster.spec.rkeConfig.machinePools[0]).toStrictEqual(autoscalingPool());
      expect(dispatch).toHaveBeenCalledWith('growl/fromError', {
        title: 'cluster.machinePool.autoscaler.pause.error',
        err:   ['nope'],
      }, { root: true });
    });

    it('should take a zero replica count for a pool the autoscaler emptied', async() => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment, cluster } = createDeployment({ machinePools: [autoscalingPool(), other], replicas: 0 });

      await deployment.toggleAutoscalerPause();

      expect(cluster.spec.rkeConfig.machinePools[0].quantity).toStrictEqual(0);
    });

    it('should refuse to resume while the autoscaler is paused for the whole cluster', async() => {
      const { deployment, cluster, save } = createDeployment({ machinePools: [pausedPool()], clusterPaused: true });

      await deployment.toggleAutoscalerPause();

      expect(save).not.toHaveBeenCalledWith();
      expect(cluster.spec.rkeConfig.machinePools[0]).toStrictEqual(pausedPool());
    });

    it('should retry on a 409, against the pool the re-fetch brought back', async() => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment, cluster, dispatch } = createDeployment({ machinePools: [autoscalingPool(), other] });
      const save = jest.fn()
        .mockImplementationOnce(() => {
          cluster.spec = { rkeConfig: { machinePools: [autoscalingPool(), other] } };

          return Promise.reject(Object.assign(new Error('conflict'), { status: 409 }));
        })
        .mockResolvedValueOnce({});

      cluster.save = save;

      await expect(deployment.toggleAutoscalerPause()).resolves.toStrictEqual(true);

      expect(save).toHaveBeenCalledTimes(2);
      expect(dispatch).not.toHaveBeenCalledWith('growl/fromError', expect.anything(), expect.anything());
      expect(cluster.spec.rkeConfig.machinePools[0]).toStrictEqual({
        name:                         'pool1',
        quantity:                     3,
        machineConfigRef:             { name: 'pool1-config' },
        machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' },
      });
    });

    it('should leave the re-fetched pool alone after a 409 it ran out of retries on', async() => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment, cluster, dispatch } = createDeployment({ machinePools: [autoscalingPool(), other] });
      const quantities = [1, 1, 9];
      const save = jest.fn().mockImplementation(() => {
        cluster.spec = { rkeConfig: { machinePools: [{ ...autoscalingPool(), quantity: quantities.shift() }, other] } };

        return Promise.reject(Object.assign(new Error('conflict'), { status: 409 }));
      });

      cluster.save = save;

      await expect(deployment.toggleAutoscalerPause()).resolves.toStrictEqual(false);

      expect(save).toHaveBeenCalledTimes(3);
      expect(cluster.spec.rkeConfig.machinePools[0]).toStrictEqual({ ...autoscalingPool(), quantity: 9 });
      expect(dispatch).toHaveBeenCalledWith('growl/fromError', {
        title: 'cluster.machinePool.autoscaler.pause.error',
        err:   ['conflict'],
      }, { root: true });
    });

    it('should hand a second click the toggle already in flight', async() => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment, save } = createDeployment({ machinePools: [autoscalingPool(), other] });

      const first = deployment.toggleAutoscalerPause();

      expect(deployment.toggleAutoscalerPause()).toBe(first);

      await first;

      expect(save).toHaveBeenCalledTimes(1);
    });

    it('should toggle again once the previous toggle has settled', async() => {
      const other = {
        ...autoscalingPool(), name: 'pool2', machineConfigRef: { name: 'pool2-config' }
      };
      const { deployment, cluster, save } = createDeployment({ machinePools: [autoscalingPool(), other] });

      await deployment.toggleAutoscalerPause();
      await deployment.toggleAutoscalerPause();

      expect(save).toHaveBeenCalledTimes(2);
      expect(cluster.spec.rkeConfig.machinePools[0]).toStrictEqual({ ...autoscalingPool(), quantity: 3 });
    });

    it('should refuse to pause the last autoscaling pool', async() => {
      const { deployment, cluster, save } = createDeployment({ machinePools: [autoscalingPool(), manualPool()] });

      await deployment.toggleAutoscalerPause();

      expect(save).not.toHaveBeenCalledWith();
      expect(cluster.spec.rkeConfig.machinePools[0]).toStrictEqual(autoscalingPool());
    });
  });
});
