import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

/**
 * ACME Order and Challenge both report a free-form `status.state`.
 * https://cert-manager.io/docs/reference/api-docs/#acme.cert-manager.io/v1.State
 */
const ACME_STATE_MAP: Record<string, string> = {
  valid:      STATES_ENUM.ACTIVE,
  ready:      STATES_ENUM.IN_PROGRESS,
  processing: STATES_ENUM.IN_PROGRESS,
  pending:    STATES_ENUM.PENDING,
  invalid:    STATES_ENUM.ERROR,
  errored:    STATES_ENUM.ERROR,
  expired:    STATES_ENUM.EXPIRED,
};

export function acmeState(state?: string): string {
  return ACME_STATE_MAP[(state || '').toLowerCase()] || STATES_ENUM.UNKNOWN;
}
