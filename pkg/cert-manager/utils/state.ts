import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

const ERROR_STATES: string[] = [STATES_ENUM.ERROR, STATES_ENUM.EXPIRED, STATES_ENUM.DENIED];
const TRANSITIONING_STATES: string[] = [STATES_ENUM.IN_PROGRESS];

/**
 * Steve derives `metadata.state` generically from a CRD's conditions, and flags anything that is
 * not Ready as `transitioning`. The badge colour comes from
 * `colorForState(state, stateObj.error, stateObj.transitioning)`, so those flags win over the
 * state a model computes for itself - a certificate we call `error` renders blue (transitioning)
 * unless the flags are corrected too.
 *
 * Everything outside these two sets is left to the shell's state table, which already colours
 * `expiring` amber, `pending` blue and `active` green.
 */
export function stateObjFor(resource: any, state: string) {
  return {
    ...(resource?.metadata?.state || {}),
    error:         ERROR_STATES.includes(state),
    transitioning: TRANSITIONING_STATES.includes(state),
  };
}
