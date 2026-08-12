<script>
import day from 'dayjs';
import Loading from '@shell/components/Loading';
import Banner from '@components/Banner/Banner.vue';
import SortableTable from '@shell/components/SortableTable';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import { CATALOG } from '@shell/config/types';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { CERT_MANAGER } from '../types';
import { CERTIFICATE_HEADERS } from '../table-headers';

const EXPIRING_SOON_DAYS = 30;
const EXPIRING_SOON_LIMIT = 10;

export default {
  name:       'CertManagerOverview',
  components: {
    Banner, Loading, SortableTable
  },

  async fetch() {
    // Missing RBAC on any one type degrades the panel it feeds rather than failing the page.
    const hash = await checkSchemasForFindAllHash({
      certificates:   { inStoreType: 'cluster', type: CERT_MANAGER.CERTIFICATE },
      issuers:        { inStoreType: 'cluster', type: CERT_MANAGER.ISSUER },
      clusterIssuers: { inStoreType: 'cluster', type: CERT_MANAGER.CLUSTER_ISSUER },
      orders:         { inStoreType: 'cluster', type: CERT_MANAGER.ORDER },
      challenges:     { inStoreType: 'cluster', type: CERT_MANAGER.CHALLENGE },
      apps:           { inStoreType: 'cluster', type: CATALOG.APP },
    }, this.$store);

    this.certificates = hash.certificates || [];
    this.issuers = hash.issuers || [];
    this.clusterIssuers = hash.clusterIssuers || [];
    this.orders = hash.orders || [];
    this.challenges = hash.challenges || [];
    this.apps = hash.apps || [];
  },

  data() {
    return {
      certificates:   [],
      issuers:        [],
      clusterIssuers: [],
      orders:         [],
      challenges:     [],
      apps:           [],
    };
  },

  computed: {
    certManagerApp() {
      return this.apps.find((app) => app.spec?.chart?.metadata?.name === 'cert-manager');
    },

    installedVersion() {
      return this.certManagerApp?.spec?.chart?.metadata?.version;
    },

    counts() {
      return [
        {
          labelKey: 'typeLabel."cert-manager.io.certificate"',
          count:    this.certificates.length,
          resource: CERT_MANAGER.CERTIFICATE,
        },
        {
          labelKey: 'typeLabel."cert-manager.io.issuer"',
          count:    this.issuers.length,
          resource: CERT_MANAGER.ISSUER,
        },
        {
          labelKey: 'typeLabel."cert-manager.io.clusterissuer"',
          count:    this.clusterIssuers.length,
          resource: CERT_MANAGER.CLUSTER_ISSUER,
        },
        {
          labelKey: 'certManager.overview.pendingOrders',
          count:    this.orders.filter((order) => order.state === STATES_ENUM.PENDING || order.state === STATES_ENUM.IN_PROGRESS).length,
          resource: CERT_MANAGER.ORDER,
        },
      ];
    },

    health() {
      const buckets = {
        [STATES_ENUM.ACTIVE]:      0,
        [STATES_ENUM.IN_PROGRESS]: 0,
        [STATES_ENUM.EXPIRING]:    0,
        [STATES_ENUM.EXPIRED]:     0,
        [STATES_ENUM.ERROR]:       0,
      };

      this.certificates.forEach((cert) => {
        if (buckets[cert.state] !== undefined) {
          buckets[cert.state]++;
        }
      });

      return Object.entries(buckets)
        .filter(([, count]) => count > 0)
        .map(([state, count]) => ({ state, count }));
    },

    expiringSoon() {
      const cutoff = day().add(EXPIRING_SOON_DAYS, 'day');

      return this.certificates
        .filter((cert) => cert.expiresAt && day(cert.expiresAt).isBefore(cutoff))
        .sort((a, b) => day(a.expiresAt).valueOf() - day(b.expiresAt).valueOf())
        .slice(0, EXPIRING_SOON_LIMIT);
    },

    /** Everything an operator would want to look at first, newest problem sources included. */
    problems() {
      const failedCertificates = this.certificates
        .filter((cert) => cert.state === STATES_ENUM.ERROR)
        .map((cert) => ({
          key: cert.id, resource: cert, reason: cert.stateDescription
        }));

      const failedOrders = this.orders
        .filter((order) => order.state === STATES_ENUM.ERROR)
        .map((order) => ({
          key: order.id, resource: order, reason: order.stateDescription
        }));

      const stuckChallenges = this.challenges
        .filter((challenge) => challenge.status?.reason && challenge.state !== STATES_ENUM.ACTIVE)
        .map((challenge) => ({
          key: challenge.id, resource: challenge, reason: challenge.status.reason
        }));

      return [...failedCertificates, ...failedOrders, ...stuckChallenges];
    },

    expiringHeaders() {
      return CERTIFICATE_HEADERS;
    },

    problemHeaders() {
      return [
        {
          name:     'type',
          labelKey: 'certManager.overview.problemType',
          // Resolves through our typeLabel entries, so this reads "Certificate" not the raw type id
          getValue: (row) => this.$store.getters['type-map/labelFor']({ id: row.resource.type }, 1),
          sort:     'resource.type',
        },
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'resource.nameDisplay',
          sort:          'resource.nameDisplay',
          formatter:     'LinkDetail',
          formatterOpts: { reference: 'resource.detailLocation' },
        },
        {
          name: 'namespace', labelKey: 'tableHeaders.namespace', value: 'resource.metadata.namespace', sort: 'resource.metadata.namespace'
        },
        {
          name: 'reason', labelKey: 'certManager.tableHeaders.reason', value: 'reason', sort: 'reason', dashIfEmpty: true
        },
      ];
    },
  },

  methods: {
    listLocation(resource) {
      // `product` and `cluster` are required path params - RouterLink throws without them,
      // which silently renders nothing at all.
      return {
        name:   'c-cluster-product-resource',
        params: {
          product: this.$store.getters['productId'],
          cluster: this.$route.params.cluster,
          resource,
        },
      };
    },

  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1>{{ t('certManager.nav.overview') }}</h1>

    <Banner
      v-if="installedVersion"
      color="info"
      :label="t('certManager.overview.installed', { version: installedVersion })"
    />

    <div class="cert-manager-counts">
      <router-link
        v-for="entry in counts"
        :key="entry.resource"
        :to="listLocation(entry.resource)"
        class="cert-manager-count"
      >
        <span class="count">{{ entry.count }}</span>
        <span class="label">{{ t(entry.labelKey, { count: entry.count }) }}</span>
      </router-link>
    </div>

    <template v-if="health.length">
      <h2>{{ t('certManager.overview.health') }}</h2>
      <div class="cert-manager-health">
        <div
          v-for="bucket in health"
          :key="bucket.state"
          class="health-bucket"
        >
          <span
            class="badge"
            :class="`bg-${ bucket.state === 'active' ? 'success' : bucket.state }`"
          />
          <span>{{ bucket.count }} {{ bucket.state }}</span>
        </div>
      </div>
    </template>

    <h2>{{ t('certManager.overview.needsAttention') }}</h2>
    <Banner
      v-if="!problems.length"
      color="success"
      :label="t('certManager.overview.noProblems')"
    />
    <SortableTable
      v-else
      :rows="problems"
      :headers="problemHeaders"
      key-field="key"
      :table-actions="false"
      :row-actions="false"
      :search="false"
      default-sort-by="name"
    />

    <h2>{{ t('certManager.overview.expiringSoon', { days: 30 }) }}</h2>
    <Banner
      v-if="!expiringSoon.length"
      color="success"
      :label="t('certManager.overview.noneExpiring', { days: 30 })"
    />
    <SortableTable
      v-else
      :rows="expiringSoon"
      :headers="expiringHeaders"
      key-field="id"
      :table-actions="false"
      :row-actions="false"
      :search="false"
      default-sort-by="expires"
    />
  </div>
</template>

<style lang="scss" scoped>
h2 {
  font-size: 16px;
  margin: 30px 0 10px;
}

.cert-manager-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.cert-manager-count {
  align-items: center;
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  color: var(--body-text);
  display: flex;
  flex: 1 1 180px;
  flex-direction: column;
  padding: 15px;

  .count {
    font-size: 32px;
    line-height: 1.2;
  }

  .label {
    opacity: 0.7;
  }
}

.cert-manager-health {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;

  .health-bucket {
    align-items: center;
    display: flex;
    gap: 8px;
  }

  .badge {
    border-radius: 50%;
    display: inline-block;
    height: 12px;
    width: 12px;
  }
}
</style>
