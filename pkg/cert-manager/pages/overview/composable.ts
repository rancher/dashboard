import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { CERT_MANAGER } from '../../types';
import {
  buildCertificateSummary, buildExpiryTiles, buildExpiringSoon, buildIssuerCard, buildAcmeCard,
} from './aggregate';
import type { OverviewRouteFn } from './types';

/** How many certificates the "Expiring Soonest" list shows before it stops. */
const EXPIRING_SOON_LIMIT = 3;

const OVERVIEW_TYPES = [
  CERT_MANAGER.CERTIFICATE,
  CERT_MANAGER.ISSUER,
  CERT_MANAGER.CLUSTER_ISSUER,
  CERT_MANAGER.ORDER,
  CERT_MANAGER.CHALLENGE,
];

/** cert-manager's own documentation, linked from the empty state. */
export const CERT_MANAGER_DOCS = 'https://cert-manager.io/docs/';

/**
 * Backs the cert-manager overview page.
 *
 * Unlike the workload dashboard, these CRDs are not registered for server-side summaries, so the
 * counts are computed from the models the store has already loaded (`cluster/all`). The store is
 * reactive, so the view models update as resources change or the namespace filter moves - no
 * polling needed.
 */
export function useCertManagerOverview() {
  const store = useStore();
  const { t } = useI18n(store);

  const loading = ref(true);
  const fetchError = ref<string | null>(null);

  const clusterId = computed<string>(() => store.getters['clusterId']);

  // ── Namespace filtering ──
  // Issuers and Certificates are namespaced, so they honour the namespace filter. ClusterIssuers
  // are cluster scoped and always shown in full.

  const isAllNamespaces = computed<boolean>(() => store.getters['isAllNamespaces']);
  const namespaceCache = computed<Record<string, boolean>>(() => store.getters['activeNamespaceCache'] || {});

  function inSelectedNamespace(resource: any): boolean {
    return isAllNamespaces.value || !!namespaceCache.value[resource?.metadata?.namespace];
  }

  const certificates = computed<any[]>(() => (store.getters['cluster/all'](CERT_MANAGER.CERTIFICATE) || []).filter(inSelectedNamespace));
  const issuers = computed<any[]>(() => (store.getters['cluster/all'](CERT_MANAGER.ISSUER) || []).filter(inSelectedNamespace));
  const clusterIssuers = computed<any[]>(() => store.getters['cluster/all'](CERT_MANAGER.CLUSTER_ISSUER) || []);
  const orders = computed<any[]>(() => (store.getters['cluster/all'](CERT_MANAGER.ORDER) || []).filter(inSelectedNamespace));
  const challenges = computed<any[]>(() => (store.getters['cluster/all'](CERT_MANAGER.CHALLENGE) || []).filter(inSelectedNamespace));

  // ── Routing ──

  const resourceRoute: OverviewRouteFn = (type: string, stateNames?: string[]): RouteLocationRaw => {
    const loc: { name: string; params: Record<string, string>; query?: Record<string, string> } = {
      name:   'c-cluster-product-resource',
      params: {
        cluster: clusterId.value, product: 'explorer', resource: type
      },
    };

    if (stateNames?.length) {
      loc.query = { stateFilter: stateNames.join(',') };
    }

    return loc;
  };

  function createRoute(type: string): RouteLocationRaw {
    return {
      name:   'c-cluster-product-resource-create',
      params: {
        cluster: clusterId.value, product: 'explorer', resource: type
      },
    };
  }

  // ── Presence flags ──

  const hasCertificates = computed<boolean>(() => certificates.value.length > 0);
  const hasIssuers = computed<boolean>(() => issuers.value.length > 0 || clusterIssuers.value.length > 0);
  const hasContent = computed<boolean>(() => hasCertificates.value || hasIssuers.value);

  const hasAcmeIssuer = computed<boolean>(() => [...issuers.value, ...clusterIssuers.value].some((i) => i.configType === 'acme'));

  // ── View models ──

  const certificateSummary = computed(() => buildCertificateSummary(certificates.value, t, resourceRoute));

  // Time-to-expiry is measured against a single "now", captured once so the tiles and the list agree
  // and do not drift while the page is open.
  const now = Date.now();

  const expiryTiles = computed(() => buildExpiryTiles(certificates.value, now, t));
  const expiringSoon = computed(() => buildExpiringSoon(certificates.value, now, EXPIRING_SOON_LIMIT, t));

  // Every certificate the "Expiring Soonest" list does not show, so the "N more" link accounts for
  // the full list it navigates to - including never-issued certificates, which have no expiry to
  // rank and so never appear in the list itself.
  const expiringSoonOverflow = computed(() => Math.max(0, certificates.value.length - expiringSoon.value.length));

  const certificatesRoute = computed<RouteLocationRaw>(() => resourceRoute(CERT_MANAGER.CERTIFICATE));

  const issuerCards = computed(() => {
    const cards = [];

    if (issuers.value.length) {
      cards.push(buildIssuerCard(
        'issuers', t('typeLabel."cert-manager.io.issuer"', { count: 2 }).trim(), CERT_MANAGER.ISSUER, issuers.value, resourceRoute
      ));
    }

    if (clusterIssuers.value.length) {
      cards.push(buildIssuerCard(
        'clusterIssuers', t('typeLabel."cert-manager.io.clusterissuer"', { count: 2 }).trim(), CERT_MANAGER.CLUSTER_ISSUER, clusterIssuers.value, resourceRoute
      ));
    }

    return cards;
  });

  const acmeCards = computed(() => [
    buildAcmeCard('orders', t('typeLabel."acme.cert-manager.io.order"', { count: 2 }).trim(), CERT_MANAGER.ORDER, orders.value, resourceRoute),
    buildAcmeCard('challenges', t('typeLabel."acme.cert-manager.io.challenge"', { count: 2 }).trim(), CERT_MANAGER.CHALLENGE, challenges.value, resourceRoute),
  ]);

  const showAcmeSection = computed<boolean>(() => hasAcmeIssuer.value);
  const showIssuersSection = computed<boolean>(() => hasIssuers.value);

  // ── Subtitle ──

  const subtitle = computed<string>(() => {
    const count = certificates.value.length;
    const scope = isAllNamespaces.value ? t('certManager.overview.subtitle.allNamespaces') : t('certManager.overview.subtitle.filtered');

    return `${ scope } ${ t('certManager.overview.certificateCount', { count }) }`;
  });

  // ── Fetching ──

  onMounted(async() => {
    try {
      const hash = OVERVIEW_TYPES.reduce((acc: Record<string, any>, type) => {
        acc[type] = { inStoreType: 'cluster', type };

        return acc;
      }, {});

      await checkSchemasForFindAllHash(hash, store);
    } catch (e: unknown) {
      fetchError.value = e instanceof Error ? e.message : t('certManager.overview.error');
    } finally {
      loading.value = false;
    }
  });

  return {
    loading,
    fetchError,
    hasContent,
    hasCertificates,
    hasIssuers,
    subtitle,
    certificateSummary,
    expiryTiles,
    expiringSoon,
    expiringSoonOverflow,
    certificatesRoute,
    issuerCards,
    acmeCards,
    showAcmeSection,
    showIssuersSection,
    resourceRoute,
    createRoute,
  };
}
