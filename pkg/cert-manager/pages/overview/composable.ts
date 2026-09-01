import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { CERT_MANAGER } from '../../types';
import { buildCertificateSummary, buildExpiringSoon, buildIssuerCard, buildAcmeCard } from './aggregate';
import type { OverviewRouteFn } from './types';

/** How many certificates the "Next to Expire" list shows before it stops. */
const EXPIRING_SOON_LIMIT = 5;

// Challenges are deliberately absent: they are transient, auto-created and GC'd within a single
// issuance, so they add churn without signal on an overview. A stuck challenge already surfaces via
// its Order and the Certificate's state.
const OVERVIEW_TYPES = [
  CERT_MANAGER.CERTIFICATE,
  CERT_MANAGER.ISSUER,
  CERT_MANAGER.CLUSTER_ISSUER,
  CERT_MANAGER.ORDER,
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

  // ── Routing ──

  // Links to a resource list. With a `state`, deep-links to that list filtered to the state via
  // `?stateFilter=`. The list filters client-side on the same model `state` getter these buckets are
  // built from (see list/cert-manager.io.certificate.vue), so bucket and filter always agree -
  // including for states the backend does not store under `metadata.state.name` (expiring, ...).
  const resourceRoute: OverviewRouteFn = (type: string, state?: string): RouteLocationRaw => ({
    name:   'c-cluster-product-resource',
    params: {
      cluster: clusterId.value, product: 'explorer', resource: type
    },
    ...(state ? { query: { stateFilter: state } } : {}),
  });

  function createRoute(type: string): RouteLocationRaw {
    return {
      name:   'c-cluster-product-resource-create',
      params: {
        cluster: clusterId.value, product: 'explorer', resource: type
      },
    };
  }

  // Clears the namespace filter - offered from the partial empty state, since a filtered-out
  // namespace is a common reason to see no certificates.
  function resetNamespaceFilter(): void {
    store.dispatch('switchNamespaces', { ids: [], key: clusterId.value });
  }

  // ── Presence flags ──

  const hasCertificates = computed<boolean>(() => certificates.value.length > 0);
  const hasIssuers = computed<boolean>(() => issuers.value.length > 0 || clusterIssuers.value.length > 0);
  const hasContent = computed<boolean>(() => hasCertificates.value || hasIssuers.value);

  // ── View models ──

  const certificateSummary = computed(() => buildCertificateSummary(certificates.value, t, resourceRoute));

  // Time-to-expiry is measured against a single "now", captured once so the list does not drift
  // while the page is open.
  const now = Date.now();

  const expiringSoon = computed(() => buildExpiringSoon(certificates.value, now, EXPIRING_SOON_LIMIT, t));

  const issuerCards = computed(() => [
    buildIssuerCard('issuers', t('typeLabel."cert-manager.io.issuer"', { count: 2 }).trim(), CERT_MANAGER.ISSUER, issuers.value, resourceRoute, { to: createRoute(CERT_MANAGER.ISSUER), label: t('certManager.overview.create.issuer') }, t('certManager.overview.emptyCard.issuers')),
    buildIssuerCard('clusterIssuers', t('typeLabel."cert-manager.io.clusterissuer"', { count: 2 }).trim(), CERT_MANAGER.CLUSTER_ISSUER, clusterIssuers.value, resourceRoute, { to: createRoute(CERT_MANAGER.CLUSTER_ISSUER), label: t('certManager.overview.create.clusterIssuer') }, t('certManager.overview.emptyCard.clusterIssuers')),
  ]);

  // Orders (and only Orders) make up ACME activity. The card is hidden entirely when there are no
  // orders - they are auto-created, never authored, so an empty card would be noise.
  const acmeCards = computed(() => [
    buildAcmeCard('orders', t('typeLabel."acme.cert-manager.io.order"', { count: 2 }).trim(), CERT_MANAGER.ORDER, orders.value, resourceRoute),
  ]);

  const showAcmeSection = computed<boolean>(() => orders.value.length > 0);
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
    subtitle,
    certificateSummary,
    expiringSoon,
    issuerCards,
    acmeCards,
    showAcmeSection,
    showIssuersSection,
    createRoute,
    resetNamespaceFilter,
  };
}
