import { stateDisplay, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import type { StateColor } from '@shell/utils/style';
import { CERT_MANAGER } from '../../types';
import type {
  StatefulResource, OverviewStatRow, OverviewStatusCard, OverviewExpiryTile, ExpiringSoonRow,
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
 * The order states are listed in the certificate summary card, healthiest first. Anything not named
 * here (an unexpected state) still renders, just after these.
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
 * Time-to-expiry buckets, soonest first. A certificate lands in the first bucket whose `maxDays`
 * still covers its remaining days; `beyond90` catches everything healthier. The colours darken as
 * expiry approaches, so a glance at the tiles reads as a risk gradient.
 */
const EXPIRY_BUCKETS: { key: string; labelKey: string; color: StateColor; maxDays: number }[] = [
  {
    key: 'expired', labelKey: 'certManager.overview.expiry.expired', color: 'error', maxDays: 0
  },
  {
    key: 'within7', labelKey: 'certManager.overview.expiry.within7', color: 'error', maxDays: 7
  },
  {
    key: 'within30', labelKey: 'certManager.overview.expiry.within30', color: 'warning', maxDays: 30
  },
  {
    key: 'within90', labelKey: 'certManager.overview.expiry.within90', color: 'info', maxDays: 90
  },
  {
    key: 'beyond90', labelKey: 'certManager.overview.expiry.beyond90', color: 'success', maxDays: Infinity
  },
];

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
 * Build a stacked-bar + rows card from a set of resources, ordered by `order`. `routeFor` turns a
 * state into a link to the pre-filtered list, so every row is clickable.
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
    .sort((a, b) => indexIn(order, a.state) - indexIn(order, b.state));
  const total = resources.length;

  const rows: OverviewStatRow[] = counts.map((c) => ({
    label: stateDisplay(c.state, true),
    color: c.color,
    count: c.count,
    to:    routeFor(type, [c.state]),
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

function bucketFor(days: number) {
  // `beyond90` has maxDays Infinity, so a match is guaranteed.
  return EXPIRY_BUCKETS.find((b) => days <= b.maxDays) as typeof EXPIRY_BUCKETS[number];
}

/**
 * Coloured tiles counting certificates by how soon they expire. Certificates with no `expiresAt`
 * (never issued) have no expiry to bucket and are skipped; empty buckets are dropped, so only the
 * windows that actually contain a certificate render.
 */
export function buildExpiryTiles(
  certificates: ExpiringCertificate[],
  now: number,
  t: Translate,
): OverviewExpiryTile[] {
  const counts: Record<string, number> = {};

  for (const c of certificates) {
    if (!c.expiresAt) {
      continue;
    }

    const bucket = bucketFor(daysUntilExpiry(c.expiresAt, now));

    counts[bucket.key] = (counts[bucket.key] || 0) + 1;
  }

  return EXPIRY_BUCKETS
    .filter((b) => counts[b.key])
    .map((b) => ({
      key: b.key, color: b.color, count: counts[b.key], label: t(b.labelKey)
    }));
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

/** A readiness card for one issuer kind (Issuer or ClusterIssuer), by state. */
export function buildIssuerCard(
  key: string,
  title: string,
  type: string,
  issuers: StatefulResource[],
  routeFor: OverviewRouteFn,
): OverviewStatusCard {
  return buildStatusCard(key, title, type, issuers, ISSUER_STATE_ORDER, routeFor);
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
