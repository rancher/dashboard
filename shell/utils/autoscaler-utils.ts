import { AUTOSCALER } from '@shell/store/features';
import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';

export function isAutoscalerFeatureFlagEnabled(store: any): boolean {
  const rootGetters = store.rootGetters || store.getters;

  return rootGetters['features/get'](AUTOSCALER);
}

/**
 * A machine pool entry of a provisioning cluster's `spec.rkeConfig.machinePools`, reduced to the fields the pool level
 * autoscaler cares about
 */
export interface AutoscalerMachinePool {
  quantity?: number;
  autoscalingMinSize?: number;
  autoscalingMaxSize?: number;
  machineDeploymentAnnotations?: { [key: string]: string };
}

/**
 * The number of machines the autoscaler is allowed to scale a machine pool between
 */
export interface AutoscalerRange {
  min?: number;
  max?: number;
}

const PAUSED_MIN_SIZE = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MIN_SIZE;
const PAUSED_MAX_SIZE = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MAX_SIZE;

/**
 * Coerce a stored size to a number, treating anything that does not parse as absent.
 *
 * Annotation values are always strings, and can be hand edited, so a value that isn't a number must not end up in
 * `autoscalingMinSize` / `autoscalingMaxSize` as `NaN`
 */
function toSize(value?: string | number): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);

  return isNaN(parsed) ? undefined : parsed;
}

/**
 * The range stashed on the pool while it is paused
 */
function stashedRange(pool?: AutoscalerMachinePool | null): AutoscalerRange {
  const annotations = pool?.machineDeploymentAnnotations || {};

  return {
    min: toSize(annotations[PAUSED_MIN_SIZE]),
    max: toSize(annotations[PAUSED_MAX_SIZE])
  };
}

/**
 * The range the pool is currently autoscaling with
 */
function liveRange(pool?: AutoscalerMachinePool | null): AutoscalerRange {
  return {
    min: toSize(pool?.autoscalingMinSize),
    max: toSize(pool?.autoscalingMaxSize)
  };
}

function hasRange(range: AutoscalerRange): boolean {
  return range.min !== undefined || range.max !== undefined;
}

/**
 * Remove the stashed range from the pool, leaving any other machine deployment annotations alone.
 *
 * The map itself goes when nothing is left in it, so a pause and resume round trip leaves the pool exactly as it was
 * rather than an empty map the pool never had
 */
function clearStashedRange(pool: AutoscalerMachinePool) {
  if (!pool.machineDeploymentAnnotations) {
    return;
  }

  delete pool.machineDeploymentAnnotations[PAUSED_MIN_SIZE];
  delete pool.machineDeploymentAnnotations[PAUSED_MAX_SIZE];

  if (!Object.keys(pool.machineDeploymentAnnotations).length) {
    delete pool.machineDeploymentAnnotations;
  }
}

/**
 * Write the range the pool autoscales with, removing a bound that has no value
 */
function writeLiveRange(pool: AutoscalerMachinePool, range: AutoscalerRange) {
  const min = toSize(range?.min);
  const max = toSize(range?.max);

  if (min === undefined) {
    delete pool.autoscalingMinSize;
  } else {
    pool.autoscalingMinSize = min;
  }

  if (max === undefined) {
    delete pool.autoscalingMaxSize;
  } else {
    pool.autoscalingMaxSize = max;
  }
}

/**
 * Write the range stashed while the pool is paused. Annotation values are strings, so each bound is stringified, and a
 * bound with no value is removed
 */
function writeStashedRange(pool: AutoscalerMachinePool, range: AutoscalerRange) {
  const min = toSize(range?.min);
  const max = toSize(range?.max);

  if (min !== undefined || max !== undefined) {
    pool.machineDeploymentAnnotations = pool.machineDeploymentAnnotations || {};
  }

  if (min === undefined) {
    delete pool.machineDeploymentAnnotations?.[PAUSED_MIN_SIZE];
  } else {
    (pool.machineDeploymentAnnotations as { [key: string]: string })[PAUSED_MIN_SIZE] = String(min);
  }

  if (max === undefined) {
    delete pool.machineDeploymentAnnotations?.[PAUSED_MAX_SIZE];
  } else {
    (pool.machineDeploymentAnnotations as { [key: string]: string })[PAUSED_MAX_SIZE] = String(max);
  }

  if (pool.machineDeploymentAnnotations && !Object.keys(pool.machineDeploymentAnnotations).length) {
    delete pool.machineDeploymentAnnotations;
  }
}

/**
 * Is the autoscaler paused for this machine pool? True when a range has been stashed on the pool
 */
export function isMachinePoolAutoscalerPaused(pool?: AutoscalerMachinePool | null): boolean {
  return hasRange(stashedRange(pool));
}

/**
 * Is the autoscaler configured for this machine pool? True while the pool is paused, given the pool's range is only
 * stashed away and not forgotten
 */
export function isMachinePoolAutoscalerEnabled(pool?: AutoscalerMachinePool | null): boolean {
  return hasRange(liveRange(pool)) || isMachinePoolAutoscalerPaused(pool);
}

/**
 * The machine pool's autoscaling range, taken from the stash when the pool is paused
 */
export function machinePoolAutoscalerRange(pool?: AutoscalerMachinePool | null): AutoscalerRange {
  const live = liveRange(pool);

  return hasRange(live) ? live : stashedRange(pool);
}

/**
 * Configure the autoscaler for this machine pool with the given range
 */
export function enableMachinePoolAutoscaler(pool: AutoscalerMachinePool | null | undefined, range: AutoscalerRange) {
  if (!pool) {
    return;
  }

  writeLiveRange(pool, range);

  clearStashedRange(pool);
}

/**
 * Change the machine pool's autoscaling range, writing wherever the range currently lives. A paused pool's range is
 * stashed, so editing it while paused updates the stash and the pool stays paused.
 *
 * `paused` says where to write. It defaults to where the pool's range is now, and a form editing a paused pool passes
 * its own state instead: clearing both bounds empties the stash, and without it the next keystroke would silently turn
 * a paused pool into a running one
 */
export function setMachinePoolAutoscalerRange(
  pool: AutoscalerMachinePool | null | undefined,
  range: AutoscalerRange,
  paused?: boolean
) {
  if (!pool) {
    return;
  }

  if (paused === undefined ? isMachinePoolAutoscalerPaused(pool) : paused) {
    writeStashedRange(pool, range);
  } else {
    writeLiveRange(pool, range);
  }
}

/**
 * Remove the autoscaler from this machine pool, both the live range and anything stashed by a pause
 */
export function disableMachinePoolAutoscaler(pool?: AutoscalerMachinePool | null) {
  if (!pool) {
    return;
  }

  delete pool.autoscalingMinSize;
  delete pool.autoscalingMaxSize;

  clearStashedRange(pool);
}

/**
 * Pause the autoscaler for this machine pool by stashing its range and removing the live values, which prunes the CAPI
 * node group annotations from the pool's machine deployment and so takes the pool out of the autoscaler's hands.
 *
 * `currentQuantity` is the number of machines the pool has right now. The pool's `quantity` is what drives the machine
 * count once the autoscaler is no longer managing the pool, so it is set to the size the autoscaler left behind and the
 * pause changes nothing but who is in control. A count that isn't a number is ignored rather than written.
 *
 * A no-op for a pool that has no autoscaler configured, or that is paused already
 */
export function pauseMachinePoolAutoscaler(pool?: AutoscalerMachinePool | null, currentQuantity?: number) {
  if (!pool || isMachinePoolAutoscalerPaused(pool)) {
    return;
  }

  const range = liveRange(pool);

  if (!hasRange(range)) {
    return;
  }

  writeStashedRange(pool, range);

  delete pool.autoscalingMinSize;
  delete pool.autoscalingMaxSize;

  const quantity = toSize(currentQuantity);

  if (quantity !== undefined) {
    pool.quantity = quantity;
  }
}

/**
 * Resume the autoscaler for this machine pool, restoring the range stashed by the pause.
 *
 * A no-op for a pool that is not paused
 */
export function resumeMachinePoolAutoscaler(pool?: AutoscalerMachinePool | null) {
  if (!pool || !isMachinePoolAutoscalerPaused(pool)) {
    return;
  }

  // The pool's `quantity` is left alone: the autoscaler takes the pool over again from the size it has now
  writeLiveRange(pool, stashedRange(pool));

  clearStashedRange(pool);
}
