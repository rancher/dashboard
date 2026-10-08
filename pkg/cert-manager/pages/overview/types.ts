import type { RouteLocationRaw } from 'vue-router';
import type { StateColor } from '@shell/utils/style';
import type { StatusSummaryCardItem } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';

/** A resource with enough state for the overview to bucket and colour it. */
export interface StatefulResource {
  state: string;
  stateSimpleColor: StateColor;
}

/** An optional "create" call-to-action shown on a card with no resources. */
export interface OverviewCreateAction {
  to: RouteLocationRaw;
  label: string;
}

/** A stacked-bar + rows card (Certificates summary, an Issuer type, an ACME resource). */
export interface OverviewStatusCard extends StatusSummaryCardItem {
  createAction?: OverviewCreateAction;
  /** Message shown when the card has no resources. Falls back to a generic string when unset. */
  emptyLabel?: string;
}

/** One row of the "Next to Expire" list: a certificate and how long it has left. */
export interface ExpiringSoonRow {
  name: string;
  to: RouteLocationRaw;
  color: StateColor;
  /** Human-readable time remaining, e.g. "89 days" or "Expired". */
  detail: string;
}

/** The slice of a Certificate model the expiry aggregation needs. */
export interface ExpiringCertificate {
  expiresAt?: string;
  nameDisplay: string;
  detailLocation: RouteLocationRaw;
  stateSimpleColor: StateColor;
}

export type OverviewRouteFn = (type: string, state?: string) => RouteLocationRaw;
