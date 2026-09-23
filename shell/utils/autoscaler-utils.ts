import { AUTOSCALER } from '@shell/store/features';
import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';

/**
 * A single entry of a provisioning cluster's `spec.rkeConfig.machinePools`
 */
export interface MachinePoolSpec {
  name?: string;
  quantity?: number;
  autoscalingMinSize?: number;
  autoscalingMaxSize?: number;
  machineDeploymentAnnotations?: { [key: string]: string };
}

/**
 * Autoscaler bounds of a machine pool, live when it is autoscaling and stashed when it is paused
 */
export interface MachinePoolAutoscalerRange {
  min?: number;
  max?: number;
}

const PAUSED_MIN = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MIN_SIZE;
const PAUSED_MAX = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MAX_SIZE;

/**
 * Every machine pool field `pauseMachinePoolAutoscaler` and `resumeMachinePoolAutoscaler` write to,
 * for a caller that needs to snapshot them and put them back
 */
export const AUTOSCALER_PAUSE_FIELDS = ['quantity', 'autoscalingMinSize', 'autoscalingMaxSize', 'machineDeploymentAnnotations'];

function isSet(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function toSize(value: unknown): number | undefined {
  const size = Number(value);

  return isSet(value) && value !== '' && !isNaN(size) ? size : undefined;
}

function stashedRange(pool?: MachinePoolSpec | null): MachinePoolAutoscalerRange | undefined {
  const annotations = pool?.machineDeploymentAnnotations;
  const min = toSize(annotations?.[PAUSED_MIN]);
  const max = toSize(annotations?.[PAUSED_MAX]);

  return min === undefined || max === undefined ? undefined : { min, max };
}

export function isAutoscalerFeatureFlagEnabled(store: any): boolean {
  const rootGetters = store.rootGetters || store.getters;

  return rootGetters['features/get'](AUTOSCALER);
}

/**
 * Is the autoscaler currently driving this machine pool?
 *
 * Both bounds are required, matching `capr.AutoscalerEnabledByProvisioningCluster` in rancher/rancher
 */
export function isMachinePoolAutoscaling(pool?: MachinePoolSpec | null): boolean {
  return isSet(pool?.autoscalingMinSize) && isSet(pool?.autoscalingMaxSize);
}

/**
 * Has this machine pool's autoscaling been paused, with its bounds stashed for a later resume?
 *
 * A pool that carries live bounds is autoscaling, whatever a leftover stash says
 */
export function isMachinePoolAutoscalerPaused(pool?: MachinePoolSpec | null): boolean {
  return !isMachinePoolAutoscaling(pool) && !!stashedRange(pool);
}

/**
 * The machine pool's autoscaler bounds, taken from the stash while it is paused
 */
export function machinePoolAutoscalerRange(pool?: MachinePoolSpec | null): MachinePoolAutoscalerRange {
  if (isMachinePoolAutoscaling(pool)) {
    return { min: pool?.autoscalingMinSize, max: pool?.autoscalingMaxSize };
  }

  return stashedRange(pool) || { min: undefined, max: undefined };
}

/**
 * Drop the stash a pause left on the pool, and the annotation map with it when nothing else is in there
 */
export function clearMachinePoolAutoscalerPause(pool: MachinePoolSpec): void {
  if (!pool.machineDeploymentAnnotations) {
    return;
  }

  const annotations = { ...pool.machineDeploymentAnnotations };

  delete annotations[PAUSED_MIN];
  delete annotations[PAUSED_MAX];

  if (Object.keys(annotations).length) {
    pool.machineDeploymentAnnotations = annotations;
  } else {
    delete pool.machineDeploymentAnnotations;
  }
}

/**
 * Stash the machine pool's autoscaler bounds and remove them, which takes the pool out of the
 * autoscaler's node groups without uninstalling the autoscaler
 *
 * @param replicas the live machine deployment replica count, so manual scaling resumes from the real count
 */
export function pauseMachinePoolAutoscaler(pool: MachinePoolSpec, replicas: number): void {
  if (!isMachinePoolAutoscaling(pool)) {
    return;
  }

  pool.machineDeploymentAnnotations = {
    ...pool.machineDeploymentAnnotations,
    [PAUSED_MIN]: `${ pool.autoscalingMinSize }`,
    [PAUSED_MAX]: `${ pool.autoscalingMaxSize }`,
  };

  delete pool.autoscalingMinSize;
  delete pool.autoscalingMaxSize;

  pool.quantity = replicas;
}

/**
 * Put the stashed autoscaler bounds back on the machine pool and drop the stash
 */
export function resumeMachinePoolAutoscaler(pool: MachinePoolSpec): void {
  const stashed = isMachinePoolAutoscaling(pool) ? undefined : stashedRange(pool);

  if (!stashed) {
    return;
  }

  pool.autoscalingMinSize = stashed.min;
  pool.autoscalingMaxSize = stashed.max;

  clearMachinePoolAutoscalerPause(pool);
}
