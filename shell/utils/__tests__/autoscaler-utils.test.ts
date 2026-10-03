import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';
import {
  MachinePoolSpec,
  clearMachinePoolAutoscalerPause,
  isMachinePoolAutoscaling,
  isMachinePoolAutoscalerPaused,
  machinePoolAutoscalerRange,
  pauseMachinePoolAutoscaler,
  resumeMachinePoolAutoscaler
} from '@shell/utils/autoscaler-utils';

const PAUSED_MIN = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MIN_SIZE;
const PAUSED_MAX = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MAX_SIZE;

describe('fx: isMachinePoolAutoscaling', () => {
  it.each([
    ['both bounds set', { autoscalingMinSize: 1, autoscalingMaxSize: 3 }, true],
    ['both bounds zero', { autoscalingMinSize: 0, autoscalingMaxSize: 0 }, true],
    ['only the min bound set', { autoscalingMinSize: 1 }, false],
    ['only the max bound set', { autoscalingMaxSize: 3 }, false],
    ['no bounds set', { quantity: 2 }, false],
    ['no pool', undefined, false],
  ])('should return %s as %s', (_label, pool, expected) => {
    expect(isMachinePoolAutoscaling(pool as MachinePoolSpec)).toStrictEqual(expected);
  });
});

describe('fx: isMachinePoolAutoscalerPaused', () => {
  it.each([
    ['both stash annotations', { machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '3' } }, true],
    ['only the min stash annotation', { machineDeploymentAnnotations: { [PAUSED_MIN]: '1' } }, false],
    ['only the max stash annotation', { machineDeploymentAnnotations: { [PAUSED_MAX]: '3' } }, false],
    ['unrelated annotations', { machineDeploymentAnnotations: { foo: 'bar' } }, false],
    ['a non-numeric stash', { machineDeploymentAnnotations: { [PAUSED_MIN]: 'one', [PAUSED_MAX]: '3' } }, false],
    ['live bounds alongside the stash', {
      autoscalingMinSize: 2, autoscalingMaxSize: 6, machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '3' }
    }, false],
    ['no annotations', { quantity: 2 }, false],
    ['no pool', undefined, false],
  ])('should return %s as %s', (_label, pool, expected) => {
    expect(isMachinePoolAutoscalerPaused(pool as MachinePoolSpec)).toStrictEqual(expected);
  });
});

describe('fx: machinePoolAutoscalerRange', () => {
  it('should read the live bounds of an autoscaling pool', () => {
    const pool = { autoscalingMinSize: 1, autoscalingMaxSize: 4 };

    expect(machinePoolAutoscalerRange(pool)).toStrictEqual({ min: 1, max: 4 });
  });

  it('should read the stashed bounds of a paused pool', () => {
    const pool = { machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } };

    expect(machinePoolAutoscalerRange(pool)).toStrictEqual({ min: 2, max: 5 });
  });

  it('should prefer the live bounds of a pool that also carries a stash', () => {
    const pool = {
      autoscalingMinSize: 2, autoscalingMaxSize: 6, machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '3' }
    };

    expect(machinePoolAutoscalerRange(pool)).toStrictEqual({ min: 2, max: 6 });
  });

  it('should return no bounds for a pool that is neither autoscaling nor paused', () => {
    expect(machinePoolAutoscalerRange({ quantity: 2 })).toStrictEqual({ min: undefined, max: undefined });
  });
});

describe('fx: pauseMachinePoolAutoscaler', () => {
  it('should stash the live bounds, remove them and take the replica count', () => {
    const pool: MachinePoolSpec = {
      quantity: 1, autoscalingMinSize: 1, autoscalingMaxSize: 4
    };

    pauseMachinePoolAutoscaler(pool, 3);

    expect(pool).toStrictEqual({
      quantity:                     3,
      machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' }
    });
  });

  it('should keep existing machine deployment annotations', () => {
    const pool: MachinePoolSpec = {
      autoscalingMinSize: 1, autoscalingMaxSize: 4, machineDeploymentAnnotations: { foo: 'bar' }
    };

    pauseMachinePoolAutoscaler(pool, 2);

    expect(pool.machineDeploymentAnnotations).toStrictEqual({
      foo: 'bar', [PAUSED_MIN]: '1', [PAUSED_MAX]: '4'
    });
  });

  it('should take a zero replica count, so a pool the autoscaler emptied is not scaled back up', () => {
    const pool: MachinePoolSpec = {
      quantity: 1, autoscalingMinSize: 0, autoscalingMaxSize: 4
    };

    pauseMachinePoolAutoscaler(pool, 0);

    expect(pool.quantity).toStrictEqual(0);
  });

  it('should do nothing to a pool that is not autoscaling', () => {
    const pool: MachinePoolSpec = { quantity: 2, autoscalingMinSize: 1 };

    pauseMachinePoolAutoscaler(pool, 5);

    expect(pool).toStrictEqual({ quantity: 2, autoscalingMinSize: 1 });
  });
});

describe('fx: resumeMachinePoolAutoscaler', () => {
  it('should restore the stashed bounds and remove an emptied annotations map', () => {
    const pool: MachinePoolSpec = {
      quantity:                     3,
      machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' }
    };

    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({
      quantity: 3, autoscalingMinSize: 1, autoscalingMaxSize: 4
    });
  });

  it('should keep other annotations in the map', () => {
    const pool: MachinePoolSpec = {
      machineDeploymentAnnotations: {
        foo: 'bar', [PAUSED_MIN]: '1', [PAUSED_MAX]: '4'
      }
    };

    resumeMachinePoolAutoscaler(pool);

    expect(pool.machineDeploymentAnnotations).toStrictEqual({ foo: 'bar' });
  });

  it('should do nothing to a pool that is not paused', () => {
    const pool: MachinePoolSpec = { quantity: 2, machineDeploymentAnnotations: { [PAUSED_MIN]: '1' } };

    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ quantity: 2, machineDeploymentAnnotations: { [PAUSED_MIN]: '1' } });
  });

  it('should leave a pool that already has live bounds alone', () => {
    const pool: MachinePoolSpec = {
      autoscalingMinSize: 2, autoscalingMaxSize: 6, machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '3' }
    };

    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({
      autoscalingMinSize: 2, autoscalingMaxSize: 6, machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '3' }
    });
  });

  it('should bail out rather than write undefined bounds for a non-numeric stash', () => {
    const pool: MachinePoolSpec = { machineDeploymentAnnotations: { [PAUSED_MIN]: 'one', [PAUSED_MAX]: 'three' } };

    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ machineDeploymentAnnotations: { [PAUSED_MIN]: 'one', [PAUSED_MAX]: 'three' } });
  });
});

describe('fx: clearMachinePoolAutoscalerPause', () => {
  it('should drop the stash of a pool that also has live bounds', () => {
    const pool: MachinePoolSpec = {
      autoscalingMinSize: 2, autoscalingMaxSize: 6, machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '3' }
    };

    clearMachinePoolAutoscalerPause(pool);

    expect(pool).toStrictEqual({ autoscalingMinSize: 2, autoscalingMaxSize: 6 });
  });

  it('should keep unrelated annotations', () => {
    const pool: MachinePoolSpec = {
      machineDeploymentAnnotations: {
        foo: 'bar', [PAUSED_MIN]: '1', [PAUSED_MAX]: '3'
      }
    };

    clearMachinePoolAutoscalerPause(pool);

    expect(pool).toStrictEqual({ machineDeploymentAnnotations: { foo: 'bar' } });
  });

  it('should do nothing to a pool with no annotations', () => {
    const pool: MachinePoolSpec = { quantity: 2 };

    clearMachinePoolAutoscalerPause(pool);

    expect(pool).toStrictEqual({ quantity: 2 });
  });
});
