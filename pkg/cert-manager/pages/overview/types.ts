import type { RouteLocationRaw } from 'vue-router';
import type { StateColor } from '@shell/utils/style';

/** A resource with enough state for the overview to bucket and colour it. */
export interface StatefulResource {
  state: string;
  stateSimpleColor: StateColor;
}

/** One state's contribution to a card: a coloured dot, a label and a count. */
export interface OverviewStatRow {
  label: string;
  color: StateColor;
  count: number;
  to?: RouteLocationRaw;
}

/** A stacked-bar + rows card (Certificates summary, an Issuer type, an ACME resource). */
export interface OverviewStatusCard {
  key: string;
  title: string;
  to?: RouteLocationRaw;
  total: number;
  segments: { color: StateColor; percent: number }[];
  rows: OverviewStatRow[];
}

/** A single coloured, count-plus-label tile - one certificate expiry window. */
export interface OverviewExpiryTile {
  key: string;
  color: StateColor;
  count: number;
  label: string;
}

/** One row of the "Expiring Soonest" list: a certificate and how long it has left. */
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

export type OverviewRouteFn = (type: string, stateNames?: string[]) => RouteLocationRaw;
