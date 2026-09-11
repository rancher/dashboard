import { stateDisplay, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import type { StateColor } from '@shell/utils/style';
import { CERT_MANAGER } from '../../types';
import type {
  StatefulResource, OverviewStatRow, OverviewStatusCard, OverviewCreateAction, ExpiringSoonRow,
  ExpiringCertificate, OverviewRouteFn,
} from './types';

type Translate = (key: string, args?: Record<string, unknown>) => string;

/** One state, its running count and the colour to draw it in. */
interface StateCount {
  state: string;
  count: number;
  color: StateColor;
}

/**
 * Health cards list states most critical (red) first, down to least critical (green), so the eye
 * lands on problems first - the same convention as the workload dashboard. The primary sort is the
 * state's colour (see COLOR_SEVERITY); these per-card orders only break ties between states that
 * share a colour. Anything not named here still renders, just after its same-coloured peers.
 */
const CERTIFICATE_STATE_ORDER = [
  STATES_ENUM.ACTIVE,
  STATES_ENUM.IN_PROGRESS,
  STATES_ENUM.PENDING,
  STATES_ENUM.EXPIRING,
  STATES_ENUM.ERROR,
  STATES_ENUM.EXPIRED,
];

const ISSUER_STATE_ORDER = [STATES_ENUM.ACTIVE, STATES_ENUM.PENDING, STATES_ENUM.ERROR];

const ACME_STATE_ORDER = [
  STATES_ENUM.ACTIVE,
  STATES_ENUM.IN_PROGRESS,
  STATES_ENUM.PENDING,
  STATES_ENUM.ERROR,
  STATES_ENUM.EXPIRED,
];

const DAY_MS = 86_400_000;

/**
 * Severity by state colour, most critical first. Drives the row/segment order on every health card
 * so red reads before green. A colour maps directly to severity, so this covers any state - including
 * issuer-only ones like `warning`/`evaluating` that no per-card order lists.
 */
const COLOR_SEVERITY: Record<StateColor, number> = {
  error: 0, warning: 1, info: 2, success: 3, disabled: 4,
};

function indexIn(order: string[], state: string): number {
  const i = order.indexOf(state);

  return i === -1 ? order.length : i;
}

/** Group resources by their computed state, keeping the colour each model reports for that state. */
export function countByState(resources: StatefulResource[]): StateCount[] {
  const map = new Map<string, StateCount>();

  for (const r of resources) {
    const existing = map.get(r.state);

    if (existing) {
      existing.count++;
    } else {
      map.set(r.state, {
        state: r.state, count: 1, color: r.stateSimpleColor
      });
    }
  }

  return [...map.values()];
}

function toSegments(counts: StateCount[], total: number): { color: StateColor; percent: number }[] {
  if (!total) {
    return [];
  }

  return counts.map((c) => ({ color: c.color, percent: (c.count / total) * 100 }));
}

/**
 * Build a stacked-bar + rows card from a set of resources, ordered by `order`. `routeFor` links the
 * whole card to the resource list, and each row deep-links to that list filtered to its state. The
 * list filters client-side on the same model `state` getter these rows are built from, so the two
 * always agree - including for states the backend cannot filter (expiring, in-progress, ...).
 */
export function buildStatusCard(
  key: string,
  title: string,
  type: string,
  resources: StatefulResource[],
  order: string[],
  routeFor: OverviewRouteFn,
): OverviewStatusCard {
  const counts = countByState(resources)
    .sort((a, b) => COLOR_SEVERITY[a.color] - COLOR_SEVERITY[b.color] || indexIn(order, a.state) - indexIn(order, b.state));
  const total = resources.length;

  const rows: OverviewStatRow[] = counts.map((c) => ({
    label: stateDisplay(c.state, true),
    color: c.color,
    count: c.count,
    to:    routeFor(type, c.state),
  }));

  return {
    key,
    title,
    to:       routeFor(type),
    total,
    segments: toSegments(counts, total),
    rows,
  };
}

/** The certificates-by-state summary card (a stacked bar plus one row per state). */
export function buildCertificateSummary(
  certificates: StatefulResource[],
  t: Translate,
  routeFor: OverviewRouteFn,
): OverviewStatusCard {
  return buildStatusCard(
    'certificates',
    t('certManager.overview.certificates.title'),
    CERT_MANAGER.CERTIFICATE,
    certificates,
    CERTIFICATE_STATE_ORDER,
    routeFor,
  );
}

/** Whole days until `expiresAt`, rounded up so anything still in the future reads as at least 1. */
export function daysUntilExpiry(expiresAt: string, now: number): number {
  return Math.ceil((new Date(expiresAt).getTime() - now) / DAY_MS);
}

/**
 * The `limit` certificates closest to expiring, soonest first, each linking to its detail page.
 * Certificates with no expiry are skipped - there is nothing to count down to.
 */
export function buildExpiringSoon(
  certificates: ExpiringCertificate[],
  now: number,
  limit: number,
  t: Translate,
): ExpiringSoonRow[] {
  return certificates
    .filter((c) => !!c.expiresAt)
    .sort((a, b) => new Date(a.expiresAt as string).getTime() - new Date(b.expiresAt as string).getTime())
    .slice(0, limit)
    .map((c) => {
      const days = daysUntilExpiry(c.expiresAt as string, now);

      return {
        name:   c.nameDisplay,
        to:     c.detailLocation,
        color:  c.stateSimpleColor,
        detail: days <= 0 ? t('certManager.overview.expiry.expired') : t('certManager.overview.expiry.days', { count: days }),
      };
    });
}

/**
 * A readiness card for one issuer kind (Issuer or ClusterIssuer), by state. Issuers and
 * ClusterIssuers are user-authored, so their cards carry a "create" action; ACME resources do not.
 */
export function buildIssuerCard(
  key: string,
  title: string,
  type: string,
  issuers: StatefulResource[],
  routeFor: OverviewRouteFn,
  createAction?: OverviewCreateAction,
  emptyLabel?: string,
): OverviewStatusCard {
  const card = buildStatusCard(key, title, type, issuers, ISSUER_STATE_ORDER, routeFor);

  return {
    ...card,
    ...(createAction ? { createAction } : {}),
    ...(emptyLabel ? { emptyLabel } : {}),
  };
}

/** An ACME activity card (Orders or Challenges) by state. */
export function buildAcmeCard(
  key: string,
  title: string,
  type: string,
  resources: StatefulResource[],
  routeFor: OverviewRouteFn,
): OverviewStatusCard {
  return buildStatusCard(key, title, type, resources, ACME_STATE_ORDER, routeFor);
}
