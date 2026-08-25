export interface Condition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export function conditionOf(resource: any, type: string): Condition | undefined {
  return (resource?.status?.conditions || []).find((c: Condition) => c.type === type);
}

/** Condition types that report a failure by being True rather than False. */
const FAILURE_WHEN_TRUE = ['Failed', 'Denied', 'InvalidRequest'];

/**
 * Steve leaves cert-manager conditions with `error: false` even when they report a failure - a
 * failed CertificateRequest comes back with Ready=False, reason "Failed" and a real failure message,
 * yet error:false / transitioning:true. The shell's default condition rendering keys off `error`, so
 * neither the Conditions table nor the tab's alert icon light up. This re-applies the same judgement
 * the models already make for the resource state.
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
