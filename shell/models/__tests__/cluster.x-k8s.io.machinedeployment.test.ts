import CapiMachineDeployment from '@shell/models/cluster.x-k8s.io.machinedeployment';
import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CAPI } from '@shell/config/types';

const PAUSED_MIN = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MIN_SIZE;
const PAUSED_MAX = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MAX_SIZE;
const MIN_SIZE = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_MIN_SIZE;
const MAX_SIZE = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_MAX_SIZE;

const MACHINE_TEMPLATE_NAME = 'nc-pool1';

type Pool = {
  name?: string,
  quantity?: number,
  machineConfigRef?: { name: string },
  autoscalingMinSize?: number,
  autoscalingMaxSize?: number,
  machineDeploymentAnnotations?: { [key: string]: string },
};

/**
 * A machine deployment wired up to a provisioning cluster containing the given machine pools
 */
function makeMachineDeployment({
  pools = [] as Pool[],
  rkeConfig = true,
  canUpdate = true,
  annotations = {} as { [key: string]: string },
  replicas = undefined as number | undefined,
  save = jest.fn(() => Promise.resolve({})),
} = {}) {
  const cluster = {
    id:   'fleet-default/test-cluster',
    spec: rkeConfig ? { rkeConfig: { machinePools: pools } } : {},
    canUpdate,
    save,
  };

  const dispatch = jest.fn();

  const rootGetters = {
    'management/byId': (type: string) => (type === CAPI.RANCHER_CLUSTER ? cluster : undefined),
    'i18n/t':          (key: string) => key,
  };

  const machineDeployment = new CapiMachineDeployment({
    type:     CAPI.MACHINE_DEPLOYMENT,
    metadata: {
      namespace: 'fleet-default', name: 'test-cluster-pool1', annotations
    },
    spec: {
      clusterName: 'test-cluster',
      replicas,
      template:    { spec: { infrastructureRef: { kind: 'Amazonec2Config', name: MACHINE_TEMPLATE_NAME } } }
    },
  }, { rootGetters, dispatch });

  return {
    machineDeployment, cluster, dispatch, save
  };
}

const livePool: Pool = {
  name:               'pool1',
  quantity:           1,
  machineConfigRef:   { name: MACHINE_TEMPLATE_NAME },
  autoscalingMinSize: 2,
  autoscalingMaxSize: 5
};
const pausedPool: Pool = {
  name:                         'pool1',
  quantity:                     3,
  machineConfigRef:             { name: MACHINE_TEMPLATE_NAME },
  machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' }
};
const plainPool: Pool = {
  name: 'pool1', quantity: 1, machineConfigRef: { name: MACHINE_TEMPLATE_NAME }
};

describe('class CapiMachineDeployment', () => {
  describe('inClusterSpec', () => {
    it('should find the pool matching the machine template', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [{ name: 'other', machineConfigRef: { name: 'nc-pool2' } }, livePool] });

      expect(machineDeployment.inClusterSpec).toStrictEqual(livePool);
    });

    it('should be undefined for a cluster with no rkeConfig', () => {
      const { machineDeployment } = makeMachineDeployment({ rkeConfig: false });

      expect(machineDeployment.inClusterSpec).toBeUndefined();
    });

    it('should be undefined when a pool has no machineConfigRef', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [{ name: 'no-ref' }] });

      expect(machineDeployment.inClusterSpec).toBeUndefined();
    });
  });

  describe('isAutoscalerEnabled', () => {
    it('should be true for a pool with a live autoscaling range', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [livePool] });

      expect(machineDeployment.isAutoscalerEnabled).toBe(true);
    });

    it('should stay true while the pool is paused', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [pausedPool] });

      expect(machineDeployment.isAutoscalerEnabled).toBe(true);
    });

    it('should be false for a pool with no autoscaler', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [plainPool] });

      expect(machineDeployment.isAutoscalerEnabled).toBe(false);
    });

    it('should read the CAPI node group annotations for a pool with no range of its own, as an upstream CAPI provider has', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [plainPool], annotations: { [MIN_SIZE]: '1', [MAX_SIZE]: '3' } });

      expect(machineDeployment.inClusterSpec).toStrictEqual(plainPool);
      expect(machineDeployment.isAutoscalerEnabled).toBe(true);
    });

    it('should read the CAPI node group annotations when the cluster has no machine pools at all', () => {
      const { machineDeployment } = makeMachineDeployment({ rkeConfig: false, annotations: { [MIN_SIZE]: '1', [MAX_SIZE]: '3' } });

      expect(machineDeployment.isAutoscalerEnabled).toBe(true);
    });

    it('should be false for a paused pool that has not resolved yet, whose CAPI annotations are pruned', () => {
      // Pins the store load window: the machine deployment's template has not loaded, so no pool matches it, and a
      // paused pool has nothing on the machine deployment to be read instead. Transient, and the controls it drives
      // render enabled and do nothing until the pool resolves
      const { machineDeployment } = makeMachineDeployment({ pools: [{ name: 'other', machineConfigRef: { name: 'nc-pool2' } }] });

      expect(machineDeployment.inClusterSpec).toBeUndefined();
      expect(machineDeployment.isAutoscalerEnabled).toBe(false);
    });

    it('should return a boolean when falling back to the CAPI node group annotations', () => {
      const { machineDeployment } = makeMachineDeployment({ rkeConfig: false });

      expect(machineDeployment.isAutoscalerEnabled).toBe(false);
    });
  });

  describe('isAutoscalerPaused', () => {
    const testCases: [string, Pool[], boolean][] = [
      ['a pool autoscaling live', [livePool], false],
      ['a paused pool', [pausedPool], true],
      ['a pool with no autoscaler', [plainPool], false],
      ['no matching pool', [], false],
    ];

    it.each(testCases)('should report %s correctly', (_label, pools, expected) => {
      const { machineDeployment } = makeMachineDeployment({ pools });

      expect(machineDeployment.isAutoscalerPaused).toBe(expected);
    });
  });

  describe('canPauseResumeAutoscaler', () => {
    it('should be true for an autoscaling pool on an updatable cluster', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [livePool], replicas: 3 });

      expect(machineDeployment.canPauseResumeAutoscaler).toBe(true);
    });

    it('should be true for a paused pool, so it can be resumed', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [pausedPool], replicas: 3 });

      expect(machineDeployment.canPauseResumeAutoscaler).toBe(true);
    });

    it('should be false until the machine deployment knows its replica count, which a pause has to record', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [livePool] });

      expect(machineDeployment.canPauseResumeAutoscaler).toBe(false);
    });

    it('should be false without permission to update the cluster', () => {
      const { machineDeployment } = makeMachineDeployment({
        pools: [livePool], canUpdate: false, replicas: 3
      });

      expect(machineDeployment.canPauseResumeAutoscaler).toBe(false);
    });

    it('should be false for a pool with no autoscaler', () => {
      const { machineDeployment } = makeMachineDeployment({ pools: [plainPool], replicas: 3 });

      expect(machineDeployment.canPauseResumeAutoscaler).toBe(false);
    });

    it('should be false for a machine deployment autoscaled by its own CAPI annotations, which there is no pool range to pause', () => {
      const { machineDeployment } = makeMachineDeployment({
        pools: [plainPool], replicas: 3, annotations: { [MIN_SIZE]: '1', [MAX_SIZE]: '3' }
      });

      expect(machineDeployment.isAutoscalerEnabled).toBe(true);
      expect(machineDeployment.canPauseResumeAutoscaler).toBe(false);
    });

    it('should be false when there is no pool in the cluster spec', () => {
      const { machineDeployment } = makeMachineDeployment({
        rkeConfig: false, replicas: 3, annotations: { [MIN_SIZE]: '1', [MAX_SIZE]: '3' }
      });

      expect(machineDeployment.canPauseResumeAutoscaler).toBe(false);
    });
  });

  describe('autoscalerResumeResize', () => {
    const stashed = (min: string, max: string) => ({ ...pausedPool, machineDeploymentAnnotations: { [PAUSED_MIN]: min, [PAUSED_MAX]: max } });

    const testCases: [string, any, number | undefined, any][] = [
      ['a count inside the stored range', stashed('2', '5'), 3, null],
      ['a count above the stored max', stashed('2', '5'), 9, {
        direction: 'down', target: 5, count: 9
      }],
      ['a count below the stored min', stashed('2', '5'), 1, {
        direction: 'up', target: 2, count: 1
      }],
      ['a count on the stored max', stashed('2', '5'), 5, null],
      ['an unknown count', stashed('2', '5'), undefined, null],
      ['a pool that is not paused', livePool, 9, null],
    ];

    it.each(testCases)('should report %s', (_label, pool, replicas, expected) => {
      const { machineDeployment } = makeMachineDeployment({ pools: [pool], replicas });

      expect(machineDeployment.autoscalerResumeResize).toStrictEqual(expected);
    });

    it('should name the bound that is breached when only one is stored', () => {
      const pool = { ...pausedPool, machineDeploymentAnnotations: { [PAUSED_MAX]: '5' } };
      const { machineDeployment } = makeMachineDeployment({ pools: [pool], replicas: 9 });

      expect(machineDeployment.autoscalerResumeResize).toStrictEqual({
        direction: 'down', target: 5, count: 9
      });
    });
  });

  describe('toggleAutoscalerPause', () => {
    it('should stash the range and save the cluster when pausing', async() => {
      const pool = { ...livePool };
      const { machineDeployment, save } = makeMachineDeployment({ pools: [pool], replicas: 7 });

      await machineDeployment.toggleAutoscalerPause();

      expect(save).toHaveBeenCalledWith();
      expect(pool).toStrictEqual({
        name:                         'pool1',
        quantity:                     7,
        machineConfigRef:             { name: MACHINE_TEMPLATE_NAME },
        machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' }
      });
    });

    it('should keep the pool at the machine count the autoscaler left it with', async() => {
      const pool = { ...livePool, quantity: 1 };
      const { machineDeployment } = makeMachineDeployment({ pools: [pool], replicas: 7 });

      await machineDeployment.toggleAutoscalerPause();

      expect(pool.quantity).toBe(7);
    });

    it('should leave the quantity alone when the machine deployment has no replica count', async() => {
      const pool = { ...livePool, quantity: 1 };
      const { machineDeployment } = makeMachineDeployment({ pools: [pool] });

      await machineDeployment.toggleAutoscalerPause();

      expect(pool.quantity).toBe(1);
    });

    it('should restore the range, and not touch the quantity, when resuming', async() => {
      const pool = { ...pausedPool, machineDeploymentAnnotations: { ...pausedPool.machineDeploymentAnnotations } };
      const { machineDeployment, save } = makeMachineDeployment({ pools: [pool], replicas: 9 });

      await machineDeployment.toggleAutoscalerPause();

      expect(save).toHaveBeenCalledWith();
      expect(pool).toStrictEqual({
        name:               'pool1',
        quantity:           3,
        machineConfigRef:   { name: MACHINE_TEMPLATE_NAME },
        autoscalingMinSize: 2,
        autoscalingMaxSize: 5
      });
    });

    it('should revert the pool, growl and reject when the save fails', async() => {
      const pool = { ...livePool, quantity: 1 };
      const save = jest.fn(() => Promise.reject(new Error('nope')));
      const { machineDeployment, dispatch } = makeMachineDeployment({
        pools: [pool], replicas: 7, save
      });

      await expect(machineDeployment.toggleAutoscalerPause()).rejects.toThrow('nope');

      expect(pool).toStrictEqual({
        name:               'pool1',
        quantity:           1,
        machineConfigRef:   { name: MACHINE_TEMPLATE_NAME },
        autoscalingMinSize: 2,
        autoscalingMaxSize: 5
      });
      expect(machineDeployment.isAutoscalerPaused).toBe(false);
      expect(dispatch).toHaveBeenCalledWith('growl/fromError', expect.objectContaining({ title: 'cluster.machinePool.autoscaler.growl.pauseError' }), { root: true });
    });

    it('should growl the resume error when a resume fails', async() => {
      const pool = { ...pausedPool, machineDeploymentAnnotations: { ...pausedPool.machineDeploymentAnnotations } };
      const save = jest.fn(() => Promise.reject(new Error('nope')));
      const { machineDeployment, dispatch } = makeMachineDeployment({ pools: [pool], save });

      await expect(machineDeployment.toggleAutoscalerPause()).rejects.toThrow('nope');

      expect(machineDeployment.isAutoscalerPaused).toBe(true);
      expect(pool.quantity).toBe(3);
      expect(dispatch).toHaveBeenCalledWith('growl/fromError', expect.objectContaining({ title: 'cluster.machinePool.autoscaler.growl.resumeError' }), { root: true });
    });

    it('should retry a conflicting save, keeping the pause it was asked for', async() => {
      const pool = { ...livePool };
      // Steve rejects with the response body, which carries the status as `_status`
      const conflict = Object.assign(new Error('conflict'), { _status: 409 });
      const save = jest.fn()
        .mockImplementationOnce(() => Promise.reject(conflict))
        .mockImplementationOnce(() => Promise.resolve({}));
      const { machineDeployment } = makeMachineDeployment({
        pools: [pool], replicas: 7, save
      });

      await machineDeployment.toggleAutoscalerPause();

      expect(save).toHaveBeenCalledTimes(2);
      expect(pool.machineDeploymentAnnotations).toStrictEqual({ [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' });
    });

    it('should not revert onto the pool a conflict refetched', async() => {
      const pool = { ...livePool };
      const conflict = Object.assign(new Error('conflict'), { status: 409 });
      const refetch: { cluster?: any } = {};
      // A real 409 refetches the cluster before it rejects, so every attempt after the first works on a fresh pool and
      // the optimistic change of the attempt before it is already gone
      const save = jest.fn(() => {
        refetch.cluster.spec.rkeConfig.machinePools = [{ ...livePool }];

        return Promise.reject(conflict);
      });
      const made = makeMachineDeployment({
        pools: [pool], replicas: 7, save
      });

      refetch.cluster = made.cluster;

      await expect(made.machineDeployment.toggleAutoscalerPause()).rejects.toThrow('conflict');

      expect(save).toHaveBeenCalledTimes(3);
      expect(made.machineDeployment.inClusterSpec).toStrictEqual(livePool);
      expect(made.dispatch).toHaveBeenCalledWith('growl/fromError', expect.objectContaining({ title: 'cluster.machinePool.autoscaler.growl.pauseError' }), { root: true });
    });

    it('should do nothing for a pool with no autoscaler', () => {
      const { machineDeployment, save } = makeMachineDeployment({ pools: [{ ...plainPool }] });

      expect(machineDeployment.toggleAutoscalerPause()).toBeUndefined();
      expect(save).not.toHaveBeenCalled();
    });

    it('should do nothing when there is no pool in the cluster spec', () => {
      const { machineDeployment, save } = makeMachineDeployment({ rkeConfig: false });

      expect(machineDeployment.toggleAutoscalerPause()).toBeUndefined();
      expect(save).not.toHaveBeenCalled();
    });
  });
});
