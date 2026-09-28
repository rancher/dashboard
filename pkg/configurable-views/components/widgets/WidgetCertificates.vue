<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Certificates from '@shell/components/Certificates.vue';
import { Banner } from '@components/Banner';
import { BadgeState } from '@components/BadgeState';
import { SECRET } from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { NAMESPACE as NAMESPACE_COL, AGE, STATE } from '@shell/config/table-headers';
import { TYPES } from '@shell/models/secret';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { useWidgetCluster, useOpenCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { fetchClusterRows, objectRoute } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// CERTIFICATES — a cluster's TLS certificates: the Certificates tab of its dashboard, as the
// dashboard draws it.
//
// On the cluster Rancher has open this IS the dashboard's own list (shell/components/Certificates)
// under the same "Full secrets list" link - its banners, its every certificate soonest to expire
// first, its search, grouping and bulk actions - with nothing around it.
//
// That component reads the `cluster` store, which holds only the open cluster. For any other cluster
// the widget reads the TLS secrets itself and draws them in the same bare table, with the same
// columns and banners. It reads EVERY one and pages in the browser, as the dashboard does: the order
// that matters is by expiry, which comes out of the certificate itself, so no server can sort by it.
// Its rows are Secret models - where the expiry, domain and state are worked out - loaded from another
// cluster's API, so the bulk actions are left off rather than pointed at the wrong store.

interface Cert {
  id: string;
  cn?: string;
  unrepeatedSans: string[];
  certState: string;
  certStateDisplay: string;
  certStateBackground: string;
  timeTilExpirationDate?: number;
  certLifetime?: string;
  metadata: { name: string; namespace?: string };
}

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);
const isOpen = useOpenCluster(cluster);

const allSecretsLink = computed<RouteLocationRaw>(() => ({
  name:   'c-cluster-product-resource',
  params: {
    cluster: cluster.value, product: EXPLORER, resource: SECRET
  }
}));

const certs = ref<Cert[]>([]);
const loading = ref(false);
const error = ref('');
const truncated = ref(false);

// The dashboard's own filter: the secret's type, which Steve lists as field 1.
const TLS = [PaginationParamFilter.createSingleField({
  field: 'metadata.fields.1', value: TYPES.TLS, exact: true, equals: true
})];

// The open cluster's certificates are the stock list's to read.
watch([cluster, isOpen], async([id, open]) => {
  certs.value = [];
  error.value = '';
  truncated.value = false;

  if (!id || open) {
    return;
  }

  loading.value = true;

  try {
    const res = await fetchClusterRows<Cert>(store, {
      resource: SECRET, cluster: id, filters: TLS
    });

    certs.value = res.rows;
    truncated.value = res.truncated;
  } catch (e) {
    error.value = t('configurableViews.errors.certificates', { cluster: id });
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const headers = [
  {
    ...STATE, formatter: null, name: 'certState', sort: ['certState', 'nameSort'], value: 'certState'
  },
  {
    name: 'name', labelKey: 'tableHeaders.name', value: 'metadata.name', sort: ['nameSort']
  },
  NAMESPACE_COL,
  {
    name:     'cn',
    labelKey: 'secret.certificate.cn',
    value:    (row: Cert) => (row.cn ? row.cn + (row.unrepeatedSans.length ? ` ${ t('secret.certificate.plusMore', { n: row.unrepeatedSans.length }) }` : '') : undefined),
    sort:     ['cn'],
    search:   ['cn'],
  }, {
    name:        'cert-expires2',
    labelKey:    'secret.certificate.expiresDuration',
    value:       (row: Cert) => row.timeTilExpirationDate,
    formatter:   'LiveDate',
    sort:        ['timeTilExpiration'],
    search:      ['timeTilExpiration'],
    defaultSort: true,
    width:       100,
  }, {
    name:      'cert-expires',
    labelKey:  'secret.certificate.expiresOn',
    value:     'cachedCertInfo.notAfter',
    formatter: 'Date',
    sort:      ['cachedCertInfo.notAfter'],
    search:    ['cachedCertInfo.notAfter'],
  }, {
    name:     'cert-lifetime',
    labelKey: 'secret.certificate.lifetime',
    value:    (row: Cert) => row.certLifetime,
    sort:     ['certLifetime'],
    search:   ['certLifetime'],
  },
  AGE,
];

const pagingParams = {
  pluralLabel:   t('secret.certificate.certificates'),
  singularLabel: t('secret.certificate.certificate'),
};

const warnings = computed(() => {
  const expiring = certs.value.filter((c) => c.certState === STATES_ENUM.EXPIRING).length;
  const expired = certs.value.filter((c) => c.certState === STATES_ENUM.EXPIRED).length;

  return {
    expiring: expiring ? t('secret.certificate.warnings.expiring', { count: expiring }) : '',
    expired:  expired ? t('secret.certificate.warnings.expired', { count: expired }) : '',
  };
});

const schema = computed(() => store.getters['management/schemaFor'](SECRET));

// The certificate's secret, as a link into this widget's cluster: zero or one (see WidgetEvents).
function linkFor(row: Cert): RouteLocationRaw[] {
  const to = objectRoute(cluster.value, {
    kind: 'Secret', apiVersion: 'v1', name: row.metadata.name, namespace: row.metadata.namespace
  });

  return to ? [to] : [];
}
</script>

<template>
  <div class="wstock">
    <h3
      v-if="widget.title"
      class="wstock__title"
    >
      {{ widget.title }}
    </h3>

    <p
      v-if="!cluster || error"
      class="wstock__msg"
      :class="{ 'wstock__msg--error': !!cluster }"
    >
      {{ cluster ? error : t(NO_CLUSTER) }}
    </p>

    <template v-else>
      <span class="wstock__link">
        <router-link :to="allSecretsLink">
          <span>{{ t('glance.secretsTable') }}</span>
        </router-link>
      </span>

      <Certificates v-if="isOpen" />

      <template v-else>
        <Banner
          v-if="warnings.expiring"
          color="warning"
          :label="warnings.expiring"
        />
        <Banner
          v-if="warnings.expired"
          color="error"
          :label="warnings.expired"
        />
        <ResourceTable
          :loading="loading"
          :schema="schema"
          :headers="headers"
          :rows="certs"
          :paging-label="'secret.certificate.paging'"
          :paging-params="pagingParams"
          :ignore-filter="true"
          :hide-manual-refresh-button="true"
          :table-actions="false"
          :row-actions="false"
          key-field="id"
        >
          <template #col:certState="{ row }">
            <td>
              <BadgeState
                :color="row.certStateBackground"
                :label="row.certStateDisplay"
              />
            </td>
          </template>
          <template #col:name="{ row }">
            <td>
              <router-link
                v-for="(to, i) in linkFor(row)"
                :key="i"
                :to="to"
              >
                {{ row.metadata.name }}
              </router-link>
            </td>
          </template>
        </ResourceTable>
        <p
          v-if="truncated"
          class="wstock__note"
        >
          {{ t('configurableViews.widget.certsTruncated') }}
        </p>
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
// Nothing around it, as on the dashboard; the link sits right-aligned above the list, as it does there.
.wstock {
  min-width: 0;

  &__title {
    font-size:   18px;
    font-weight: 600;
    line-height: 22px;
    margin:      0 0 12px;
  }

  &__msg {
    color:     var(--muted);
    font-size: 14px;
    margin:    0;

    &--error {
      color: var(--error);
    }
  }

  &__link {
    display:         flex;
    justify-content: flex-end;
    margin-bottom:   20px;
  }

  &__note {
    color:     var(--muted);
    font-size: 12px;
    margin:    8px 0 0;
  }
}
</style>
