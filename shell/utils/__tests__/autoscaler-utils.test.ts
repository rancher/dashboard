import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';
import {
  AutoscalerMachinePool,
  disableMachinePoolAutoscaler,
  enableMachinePoolAutoscaler,
  isMachinePoolAutoscalerEnabled,
  isMachinePoolAutoscalerPaused,
  machinePoolAutoscalerRange,
  pauseMachinePoolAutoscaler,
  resumeMachinePoolAutoscaler,
  setMachinePoolAutoscalerRange
} from '@shell/utils/autoscaler-utils';

const PAUSED_MIN = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MIN_SIZE;
const PAUSED_MAX = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MAX_SIZE;

describe('fx: isMachinePoolAutoscalerPaused', () => {
  const testCases: [string, AutoscalerMachinePool | undefined, boolean][] = [
    ['an undefined pool', undefined, false],
    ['a pool with no autoscaler', {}, false],
    ['a pool autoscaling live', { autoscalingMinSize: 1, autoscalingMaxSize: 3 }, false],
    ['a pool with unrelated machine deployment annotations', { machineDeploymentAnnotations: { foo: 'bar' } }, false],
    ['a paused pool', { machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '3' } }, true],
    ['a pool with only a stashed min', { machineDeploymentAnnotations: { [PAUSED_MIN]: '1' } }, true],
    ['a pool with a stashed range that does not parse', { machineDeploymentAnnotations: { [PAUSED_MIN]: 'not-a-number' } }, false],
  ];

  it.each(testCases)('should report %s correctly', (_label, pool, expected) => {
    expect(isMachinePoolAutoscalerPaused(pool)).toBe(expected);
  });
});

describe('fx: isMachinePoolAutoscalerEnabled', () => {
  const testCases: [string, AutoscalerMachinePool | undefined, boolean][] = [
    ['an undefined pool', undefined, false],
    ['a pool with no autoscaler', {}, false],
    ['a pool autoscaling live', { autoscalingMinSize: 1, autoscalingMaxSize: 3 }, true],
    ['a pool with only a min size', { autoscalingMinSize: 1 }, true],
    ['a pool with only a max size', { autoscalingMaxSize: 3 }, true],
    ['a paused pool', { machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '3' } }, true],
    ['a pool with unrelated machine deployment annotations', { machineDeploymentAnnotations: { foo: 'bar' } }, false],
  ];

  it.each(testCases)('should report %s correctly', (_label, pool, expected) => {
    expect(isMachinePoolAutoscalerEnabled(pool)).toBe(expected);
  });
});

describe('fx: machinePoolAutoscalerRange', () => {
  it('should return an empty range for an undefined pool', () => {
    expect(machinePoolAutoscalerRange(undefined)).toStrictEqual({ min: undefined, max: undefined });
  });

  it('should return the live range of a running pool', () => {
    expect(machinePoolAutoscalerRange({ autoscalingMinSize: 2, autoscalingMaxSize: 5 })).toStrictEqual({ min: 2, max: 5 });
  });

  it('should return the stashed range of a paused pool', () => {
    const pool = { machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } };

    expect(machinePoolAutoscalerRange(pool)).toStrictEqual({ min: 2, max: 5 });
  });

  it('should ignore a stashed value that does not parse as a number', () => {
    const pool = { machineDeploymentAnnotations: { [PAUSED_MIN]: 'three', [PAUSED_MAX]: '5' } };

    expect(machinePoolAutoscalerRange(pool)).toStrictEqual({ min: undefined, max: 5 });
  });
});

describe('fx: enableMachinePoolAutoscaler', () => {
  it('should write the given range', () => {
    const pool: AutoscalerMachinePool = {};

    enableMachinePoolAutoscaler(pool, { min: 1, max: 2 });

    expect(pool).toStrictEqual({ autoscalingMinSize: 1, autoscalingMaxSize: 2 });
  });

  it('should clear anything stashed by an earlier pause', () => {
    const pool: AutoscalerMachinePool = { machineDeploymentAnnotations: { [PAUSED_MIN]: '4', [PAUSED_MAX]: '9' } };

    enableMachinePoolAutoscaler(pool, { min: 1, max: 2 });

    expect(pool).toStrictEqual({ autoscalingMinSize: 1, autoscalingMaxSize: 2 });
    expect(isMachinePoolAutoscalerPaused(pool)).toBe(false);
  });

  it('should not throw for an undefined pool', () => {
    expect(() => enableMachinePoolAutoscaler(undefined, { min: 1, max: 2 })).not.toThrow();
  });
});

describe('fx: disableMachinePoolAutoscaler', () => {
  it('should remove the live range', () => {
    const pool: AutoscalerMachinePool = { autoscalingMinSize: 1, autoscalingMaxSize: 2 };

    disableMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({});
    expect(isMachinePoolAutoscalerEnabled(pool)).toBe(false);
  });

  it('should remove the stashed range of a paused pool, leaving other annotations alone', () => {
    const pool: AutoscalerMachinePool = {
      machineDeploymentAnnotations: {
        [PAUSED_MIN]: '1', [PAUSED_MAX]: '2', foo: 'bar'
      }
    };

    disableMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ machineDeploymentAnnotations: { foo: 'bar' } });
    expect(isMachinePoolAutoscalerEnabled(pool)).toBe(false);
  });

  it('should remove a machine deployment annotations map that held nothing but the stash', () => {
    const pool: AutoscalerMachinePool = { machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '2' } };

    disableMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({});
  });

  it('should not throw for an undefined pool', () => {
    expect(() => disableMachinePoolAutoscaler(undefined)).not.toThrow();
  });
});

describe('fx: pauseMachinePoolAutoscaler', () => {
  it('should stash the live range and remove it from the pool', () => {
    const pool: AutoscalerMachinePool = { autoscalingMinSize: 2, autoscalingMaxSize: 5 };

    pauseMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } });
    expect(isMachinePoolAutoscalerPaused(pool)).toBe(true);
    expect(isMachinePoolAutoscalerEnabled(pool)).toBe(true);
  });

  it('should keep the pool at the size the autoscaler left it', () => {
    const pool: AutoscalerMachinePool = {
      quantity: 1, autoscalingMinSize: 1, autoscalingMaxSize: 9
    };

    pauseMachinePoolAutoscaler(pool, 7);

    expect(pool.quantity).toBe(7);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['not a number', 'three'],
  ])('should leave the quantity alone when the current count is %s', (_label, count) => {
    const pool: AutoscalerMachinePool = {
      quantity: 1, autoscalingMinSize: 1, autoscalingMaxSize: 9
    };

    pauseMachinePoolAutoscaler(pool, count as any);

    expect(pool.quantity).toBe(1);
  });

  it('should not touch the quantity of a pool it does not pause', () => {
    const pool: AutoscalerMachinePool = { quantity: 1 };

    pauseMachinePoolAutoscaler(pool, 7);

    expect(pool).toStrictEqual({ quantity: 1 });
  });

  it('should be a no-op for a pool with no autoscaler', () => {
    const pool: AutoscalerMachinePool = { machineDeploymentAnnotations: { foo: 'bar' } };

    pauseMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ machineDeploymentAnnotations: { foo: 'bar' } });
  });

  it('should be a no-op for a pool that is already paused', () => {
    const pool: AutoscalerMachinePool = { machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } };

    pauseMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } });
  });

  it('should not throw for an undefined pool', () => {
    expect(() => pauseMachinePoolAutoscaler(undefined)).not.toThrow();
  });
});

describe('fx: resumeMachinePoolAutoscaler', () => {
  it('should restore the stashed range', () => {
    const pool: AutoscalerMachinePool = { machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } };

    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ autoscalingMinSize: 2, autoscalingMaxSize: 5 });
    expect(isMachinePoolAutoscalerPaused(pool)).toBe(false);
  });

  it('should ignore a stashed value that does not parse as a number', () => {
    const pool: AutoscalerMachinePool = { machineDeploymentAnnotations: { [PAUSED_MIN]: 'nonsense', [PAUSED_MAX]: '5' } };

    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ autoscalingMaxSize: 5 });
    expect(pool.autoscalingMinSize).toBeUndefined();
  });

  it('should be a no-op for a pool that is not paused', () => {
    const pool: AutoscalerMachinePool = { autoscalingMinSize: 2, autoscalingMaxSize: 5 };

    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({ autoscalingMinSize: 2, autoscalingMaxSize: 5 });
  });

  it('should leave the quantity alone, so the autoscaler takes the pool over at the size it has', () => {
    const pool: AutoscalerMachinePool = { quantity: 7, machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } };

    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({
      quantity: 7, autoscalingMinSize: 2, autoscalingMaxSize: 5
    });
  });

  it('should not throw for an undefined pool', () => {
    expect(() => resumeMachinePoolAutoscaler(undefined)).not.toThrow();
  });
});

describe('machine pool autoscaler pause round trip', () => {
  it('should return the identical range after enable, pause and resume', () => {
    const pool: AutoscalerMachinePool = {};

    enableMachinePoolAutoscaler(pool, { min: 3, max: 7 });
    const enabledRange = machinePoolAutoscalerRange(pool);

    pauseMachinePoolAutoscaler(pool);

    expect(machinePoolAutoscalerRange(pool)).toStrictEqual(enabledRange);
    expect(pool.autoscalingMinSize).toBeUndefined();
    expect(pool.autoscalingMaxSize).toBeUndefined();

    resumeMachinePoolAutoscaler(pool);

    expect(machinePoolAutoscalerRange(pool)).toStrictEqual(enabledRange);
    expect(pool.autoscalingMinSize).toBe(3);
    expect(pool.autoscalingMaxSize).toBe(7);
  });

  it('should leave the pool exactly as it was after a pause and a resume', () => {
    const pool: AutoscalerMachinePool = {
      quantity: 4, autoscalingMinSize: 3, autoscalingMaxSize: 7
    };

    pauseMachinePoolAutoscaler(pool, 4);
    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({
      quantity: 4, autoscalingMinSize: 3, autoscalingMaxSize: 7
    });
  });

  it('should keep machine deployment annotations that are not the autoscaler stash', () => {
    const pool: AutoscalerMachinePool = {
      autoscalingMinSize:           3,
      autoscalingMaxSize:           7,
      machineDeploymentAnnotations: { 'some.io/annotation': 'a-value' }
    };

    pauseMachinePoolAutoscaler(pool);
    resumeMachinePoolAutoscaler(pool);

    expect(pool).toStrictEqual({
      autoscalingMinSize:           3,
      autoscalingMaxSize:           7,
      machineDeploymentAnnotations: { 'some.io/annotation': 'a-value' }
    });
  });
});

describe('fx: setMachinePoolAutoscalerRange', () => {
  it('should write the live range of a running pool', () => {
    const pool: AutoscalerMachinePool = { autoscalingMinSize: 1, autoscalingMaxSize: 2 };

    setMachinePoolAutoscalerRange(pool, { min: 3, max: 9 });

    expect(pool).toStrictEqual({ autoscalingMinSize: 3, autoscalingMaxSize: 9 });
  });

  it('should write the stash of a paused pool, and keep it paused', () => {
    const pool: AutoscalerMachinePool = { machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '2' } };

    setMachinePoolAutoscalerRange(pool, { min: 3, max: 9 });

    expect(pool).toStrictEqual({ machineDeploymentAnnotations: { [PAUSED_MIN]: '3', [PAUSED_MAX]: '9' } });
    expect(isMachinePoolAutoscalerPaused(pool)).toBe(true);
    expect(machinePoolAutoscalerRange(pool)).toStrictEqual({ min: 3, max: 9 });
  });

  it('should remove a bound that has been cleared', () => {
    const pool: AutoscalerMachinePool = { machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '2' } };

    setMachinePoolAutoscalerRange(pool, { min: undefined, max: 2 });

    expect(pool).toStrictEqual({ machineDeploymentAnnotations: { [PAUSED_MAX]: '2' } });
    expect(isMachinePoolAutoscalerPaused(pool)).toBe(true);
  });

  it('should not throw for an undefined pool', () => {
    expect(() => setMachinePoolAutoscalerRange(undefined, { min: 1, max: 2 })).not.toThrow();
  });
});
