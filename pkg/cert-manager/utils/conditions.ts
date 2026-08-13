export interface Condition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
  observedGeneration?: number;
}

export function conditionOf(resource: any, type: string): Condition | undefined {
  return (resource?.status?.conditions || []).find((c: Condition) => c.type === type);
}

export function isConditionTrue(resource: any, type: string): boolean {
  return conditionOf(resource, type)?.status === 'True';
}

export function isConditionFalse(resource: any, type: string): boolean {
  return conditionOf(resource, type)?.status === 'False';
}

/** Condition types that report a failure by being True rather than False. */
const FAILURE_WHEN_TRUE = ['Failed', 'Denied', 'InvalidRequest'];

/**
 * Steve only tags conditions with `error` for resource types it has mappings for, so cert-manager
 * conditions arrive unclassified and neither the Conditions table nor the tab's alert icon light
 * up. This applies the same judgement the models already make for the resource state.
 *
 * A merely-not-True condition is not enough on its own: a certificate part way through issuance
 * legitimately has Ready=False, and flagging that would cry wolf. So Ready-style conditions only
 * count once the resource itself is in an error state.
 */
export function isFailingCondition(condition: Condition, resourceIsErrored: boolean): boolean {
  if (FAILURE_WHEN_TRUE.includes(condition?.type)) {
    return condition.status === 'True';
  }

  return resourceIsErrored && condition?.status === 'False';
}
