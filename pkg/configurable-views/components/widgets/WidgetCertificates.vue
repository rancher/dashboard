<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { Banner } from '@components/Banner';
import { BadgeState } from '@components/BadgeState';
import { SECRET } from '@shell/config/types';
import { NAMESPACE as NAMESPACE_COL, AGE, STATE } from '@shell/config/table-headers';
import { TYPES } from '@shell/models/secret';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import WidgetCard from './WidgetCard.vue';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { fetchClusterRows, objectRoute } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// CERTIFICATES — a cluster's TLS certificates, soonest to expire first, with the warnings above them:
// the Certificates tab of its dashboard.
//
// The dashboard's own list (shell/components/Certificates) - its columns and its two banners - over
// the cluster this widget names; that component reads the `cluster` store, which holds only the
// cluster that is open. Like it, this reads EVERY TLS secret and pages in the browser: the order
// that matters is by expiry, which comes out of the certificate itself, so no server can sort by it.
// The rows are Secret models, which is where the expiry, the domain and the state are worked out.

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

const certs = ref<Cert[]>([]);
const loading = ref(false);
const error = ref('');
const truncated = ref(false);

// The dashboard's own filter: the secret's type, which Steve lists as field 1.
const TLS = [PaginationParamFilter.createSingleField({
  field: 'metadata.fields.1', value: TYPES.TLS, exact: true, equals: true
})];

watch(cluster, async(id) => {
  certs.value = [];
  error.value = '';
  truncated.value = false;

  if (!id) {
    return;
  }

  loading.value = true;

  try {
    const res = await fetchClusterRows(store, {
      resource: SECRET, cluster: id, filters: TLS
    });

    certs.value = res.rows as Cert[];
    truncated.value = res.truncated;
  } catch (e) {
    error.value = `Could not read the certificates of cluster “${ id }”.`;
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
  <WidgetCard
    :title="widget.title || t('clusterIndexPage.sections.certs.label')"
    :loading="loading && !certs.length"
    :error="cluster ? error : NO_CLUSTER"
  >
    <template v-if="cluster">
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
        :search="false"
        :rows-per-page="widget.limit || 10"
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
        class="wcert__note"
      >
        This cluster has more certificates than are read at once, so the list is ordered over the
        first of them.
      </p>
    </template>
  </WidgetCard>
</template>

<style lang="scss" scoped>
.wcert__note {
  color:     var(--muted);
  font-size: 12px;
  margin:    8px 0 0;
}
</style>
