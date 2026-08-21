import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { CERT_MANAGER } from '../../../types';
import {
  countByState, buildStatusCard, buildCertificateSummary, daysUntilExpiry, buildExpiryTiles,
  buildExpiringSoon, buildIssuerCard,
} from '../aggregate';
import type { StatefulResource, ExpiringCertificate, OverviewRouteFn } from '../types';

const t = (key: string, args?: Record<string, unknown>) => (args ? `${ key }:${ args.count }` : key);
const routeFor: OverviewRouteFn = (type: string, stateNames?: string[]) => ({ type, stateNames } as any);

const res = (state: string, stateSimpleColor: any): StatefulResource => ({ state, stateSimpleColor });

const NOW = new Date('2026-08-17T00:00:00Z').getTime();
const inDays = (days: number) => new Date(NOW + days * 86_400_000).toISOString();

const cert = (expiresAt: string | undefined, name = 'c', color: any = 'success'): ExpiringCertificate => ({
  expiresAt, nameDisplay: name, detailLocation: { name: 'detail', params: { id: name } } as any, stateSimpleColor: color,
});

describe('cert-manager overview aggregate', () => {
  describe('countByState', () => {
    it('should group by state and keep each state\'s colour', () => {
      const counts = countByState([
        res(STATES_ENUM.ACTIVE, 'success'),
        res(STATES_ENUM.ACTIVE, 'success'),
        res(STATES_ENUM.ERROR, 'error'),
      ]);

      expect(counts).toStrictEqual([
        {
          state: STATES_ENUM.ACTIVE, count: 2, color: 'success'
        },
        {
          state: STATES_ENUM.ERROR, count: 1, color: 'error'
        },
      ]);
    });

    it('should be empty for no resources', () => {
      expect(countByState([])).toStrictEqual([]);
    });
  });

  describe('buildStatusCard', () => {
    const order = [STATES_ENUM.ACTIVE, STATES_ENUM.PENDING, STATES_ENUM.ERROR];

    it('should total, order and link the rows', () => {
      const card = buildStatusCard(
        'k',
        'Title',
        CERT_MANAGER.ISSUER,
        [res(STATES_ENUM.ERROR, 'error'), res(STATES_ENUM.ACTIVE, 'success'), res(STATES_ENUM.ACTIVE, 'success')],
        order,
        routeFor,
      );

      expect(card.total).toBe(3);
      // ordered active-before-error even though error was first in
      expect(card.rows.map((r) => r.color)).toStrictEqual(['success', 'error']);
      expect(card.rows[0].count).toBe(2);
      expect(card.rows[0].to).toStrictEqual({ type: CERT_MANAGER.ISSUER, stateNames: [STATES_ENUM.ACTIVE] });
      expect(card.to).toStrictEqual({ type: CERT_MANAGER.ISSUER, stateNames: undefined });
    });

    it('should produce segments that fill the bar', () => {
      const card = buildStatusCard('k', 'Title', CERT_MANAGER.ISSUER, [
        res(STATES_ENUM.ACTIVE, 'success'), res(STATES_ENUM.ERROR, 'error'),
      ], order, routeFor);

      expect(card.segments).toStrictEqual([
        { color: 'success', percent: 50 },
        { color: 'error', percent: 50 },
      ]);
    });

    it('should have no segments and no rows when empty', () => {
      const card = buildStatusCard('k', 'Title', CERT_MANAGER.ISSUER, [], order, routeFor);

      expect(card.segments).toStrictEqual([]);
      expect(card.rows).toStrictEqual([]);
      expect(card.total).toBe(0);
    });
  });

  describe('buildCertificateSummary', () => {
    it('should build a certificate-typed status card ordered healthiest first', () => {
      const card = buildCertificateSummary(
        [res(STATES_ENUM.ERROR, 'error'), res(STATES_ENUM.ACTIVE, 'success')],
        t,
        routeFor,
      );

      expect(card.title).toBe('certManager.overview.certificates.title');
      expect(card.to).toStrictEqual({ type: CERT_MANAGER.CERTIFICATE, stateNames: undefined });
      expect(card.rows.map((r) => r.color)).toStrictEqual(['success', 'error']);
    });
  });

  describe('daysUntilExpiry', () => {
    it('should round a future expiry up to whole days', () => {
      // 5 days and 2 hours out still reads as 6 whole days remaining.
      expect(daysUntilExpiry(new Date(NOW + (5 * 86_400_000) + (2 * 3_600_000)).toISOString(), NOW)).toBe(6);
    });

    it('should be zero or negative once expired', () => {
      expect(daysUntilExpiry(inDays(-3), NOW)).toBe(-3);
    });
  });

  describe('buildExpiryTiles', () => {
    it('should bucket by window and drop the empty ones', () => {
      const tiles = buildExpiryTiles([
        cert(inDays(-1)), // expired
        cert(inDays(3)), // within 7
        cert(inDays(3)), // within 7
        cert(inDays(200)), // beyond 90
        cert(undefined), // never issued - skipped
      ], NOW, t);

      expect(tiles).toStrictEqual([
        {
          key: 'expired', color: 'error', count: 1, label: 'certManager.overview.expiry.expired'
        },
        {
          key: 'within7', color: 'error', count: 2, label: 'certManager.overview.expiry.within7'
        },
        {
          key: 'beyond90', color: 'success', count: 1, label: 'certManager.overview.expiry.beyond90'
        },
      ]);
    });

    it('should keep the buckets in soonest-first order regardless of input order', () => {
      const tiles = buildExpiryTiles([cert(inDays(200)), cert(inDays(20)), cert(inDays(-1))], NOW, t);

      expect(tiles.map((tile) => tile.key)).toStrictEqual(['expired', 'within30', 'beyond90']);
    });

    it('should be empty when no certificate has an expiry', () => {
      expect(buildExpiryTiles([cert(undefined)], NOW, t)).toStrictEqual([]);
    });
  });

  describe('buildExpiringSoon', () => {
    it('should list the soonest-expiring certificates, up to the limit', () => {
      const rows = buildExpiringSoon([
        cert(inDays(90), 'c90'), cert(inDays(2), 'c2'), cert(inDays(30), 'c30'), cert(undefined, 'never'),
      ], NOW, 2, t);

      expect(rows.map((r) => r.name)).toStrictEqual(['c2', 'c30']);
      expect(rows[0].detail).toBe('certManager.overview.expiry.days:2');
    });

    it('should label an already-expired certificate rather than count negative days', () => {
      const [row] = buildExpiringSoon([cert(inDays(-4), 'gone', 'error')], NOW, 5, t);

      expect(row.detail).toBe('certManager.overview.expiry.expired');
      expect(row.color).toBe('error');
    });

    it('should skip certificates with no expiry', () => {
      expect(buildExpiringSoon([cert(undefined)], NOW, 5, t)).toStrictEqual([]);
    });
  });

  describe('buildIssuerCard', () => {
    it('should build an issuer-typed status card', () => {
      const card = buildIssuerCard(
        'issuers',
        'Issuers',
        CERT_MANAGER.ISSUER,
        [res(STATES_ENUM.ACTIVE, 'success'), res(STATES_ENUM.ERROR, 'error')],
        routeFor,
      );

      expect(card.total).toBe(2);
      expect(card.rows.map((r) => r.color)).toStrictEqual(['success', 'error']);
      expect(card.to).toStrictEqual({ type: CERT_MANAGER.ISSUER, stateNames: undefined });
    });
  });
});
