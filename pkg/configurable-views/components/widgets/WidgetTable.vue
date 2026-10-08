<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { useI18n } from '@shell/composables/useI18n';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import WidgetCard from './WidgetCard.vue';
import { fetchClusterSchemas, storeForType } from '../../templating/widget-data';
import { PAGINATION_CONTEXT } from '../../templating/widget-catalog';
import type { TypeSchema } from '../../templating/resource-types';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { useClusterPage } from '../../composables/useClusterPage';
import { useSharedTypeList } from '../../composables/useSharedTypeList';
import type { TableColumn } from '@shell/types/store/type-map';
import type { WidgetSpec } from '../../templating/types';

// TABLE — "Rows of a resource".
//
// The widget says WHAT the table shows: the resource, and where it is read from - Rancher's own API,
// or one cluster's (`fromCluster`). HOW it shows it is the table views': the toolbar every resource list has, with its
// filter query, columns, grouping, sort and export, and, when the widget asks (`viewTabs`), the
// saved-view tabs. The saved views are the type's own, shared with every list of it, unless the
// widget keeps its own (`ownViews`), which live under the type by the widget's id.
//
// From RANCHER, it is rendered by Rancher's PaginatedResourceTable - the fetch, server-side paging
// where the shell pages the type (see PAGINATION_CONTEXT), and the plumbing that goes with them. From a
// CLUSTER, it is read from that cluster's own API instead (see useClusterPage), whole, for the table to
// page, sort and filter itself.
//
// It is KEYED on what it asks for (see tableKey): the table fetches for the schema it was built with
// and reads its saved views once, when it is built, so a new question is a new table.

const props = withDefaults(defineProps<{ widget: WidgetSpec; nodeId?: string }>(), { nodeId: '' });

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

/** Rows per page: a widget is a glance at a list, not the list. */
const PER_PAGE = 10;

// Read from a cluster's own API rather than Rancher's: a different fetch, and a different table.
const downstream = computed(() => !!props.widget.fromCluster);

/**
 * The type the table lists. Rancher's own list of provisioning clusters lists their MANAGEMENT
 * clusters - its rows and columns (provider, version, machines) are the management cluster's - so a
 * table of provisioning clusters read from Rancher does the same. Read whole, a provisioning cluster
 * has only its CRD's columns: its id for a name, and no provider, version or machines.
 */
const listed = computed(() => (!downstream.value && props.widget.resource === CAPI.RANCHER_CLUSTER ? MANAGEMENT.CLUSTER : props.widget.resource));

const inStore = computed(() => storeForType(store.getters, listed.value));

const storeSchema = computed(() => (listed.value ? store.getters[`${ inStore.value }/schemaFor`](listed.value) : null));

/**
 * The schema of a type only the widget's cluster has - a CRD the local cluster does not - which no
 * store holds, so it is read from that cluster. Its columns are then the ones the CRD declares.
 */
const clusterSchema = ref<TypeSchema | null>(null);

watch(() => [downstream.value && !storeSchema.value ? props.widget.resource : '', downstream.value ? cluster.value : ''], async([resource, from]) => {
  clusterSchema.value = null;

  if (!resource || !from) {
    return;
  }

  const schemas = await fetchClusterSchemas(store, from).catch(() => []);

  clusterSchema.value = schemas.find((s) => s.id === resource) || null;
}, { immediate: true });

const schema = computed(() => storeSchema.value || clusterSchema.value);

/**
 * A type's header, minus the link into the resource's detail page.
 *
 * That link goes to the cluster in the page's URL, which is not the widget's: the Home has none, and
 * a cluster's dashboard can hold a widget showing another cluster. So it would break or lead to the
 * wrong cluster - the stock Home's own cluster table drops it for the same reason.
 */
function withoutDetailLink(header: TableColumn): TableColumn {
  if (header?.formatter !== 'LinkDetail') {
    return header;
  }

  const { formatter, ...rest } = header;

  return rest;
}

// The type's own columns, as its list page has them - and, for a list the server pages, the ones the
// server can sort and filter by.
const headersFor = (paged: boolean): TableColumn[] => (schema.value ? (store.getters['type-map/headersFor'](schema.value, paged) || []).map(withoutDetailLink) : []);
const headers = computed(() => headersFor(false));
const pagedHeaders = computed(() => headersFor(true));

// The table views' saved-view tabs, and whose saved views they are: the type's, or this widget's.
const viewTabs = computed(() => !!props.widget.viewTabs);
const tableViewsPage = computed(() => (props.widget.ownViews && props.nodeId ? `widget-${ props.nodeId }` : null));

// Rebuilt, too, when another table of the same global type leaves the page (see useSharedTypeList).
const shared = useSharedTypeList(() => (!downstream.value && listed.value ? `${ inStore.value }/${ listed.value }` : null));

const tableKey = computed(() => JSON.stringify([listed.value, downstream.value, !!schema.value, viewTabs.value, tableViewsPage.value, shared.value]));

// ---- a per-cluster type -----------------------------------------------------------------------------

const {
  rows, loading: loadingRows, error: rowsError, truncated
} = useClusterPage(() => ({
  resource: props.widget.resource,
  // A global type is not read here at all - its table fetches for itself.
  cluster:  downstream.value ? cluster.value : '',
  perPage:  PER_PAGE,
  whole:    true,
}));

/**
 * The count beside the title, as a list's heading shows it: how many rows there are.
 *
 * From a named cluster, how many were read. For a global type, the total the store kept with the page
 * it last asked for, or, when it holds every row, how many it holds.
 */
const count = computed<number | null>(() => {
  if (downstream.value) {
    return rows.value.length;
  }

  if (!schema.value) {
    return null;
  }

  const page = store.getters[`${ inStore.value }/havePage`]?.(listed.value);

  if (typeof page?.result?.count === 'number') {
    return page.result.count;
  }

  return (store.getters[`${ inStore.value }/all`]?.(listed.value) || []).length;
});

const downstreamMessage = computed(() => (cluster.value ? rowsError.value : t(NO_CLUSTER)));
</script>

<template>
  <WidgetCard
    v-if="downstream"
    :title="widget.title"
    :count="widget.title ? count : null"
    :loading="loadingRows && !rows.length"
    :error="downstreamMessage"
  >
    <!-- A type read from a named cluster: we fetch its rows ourselves, because the cluster is not
       something PaginatedResourceTable can be told about. -->
    <ResourceTable
      :key="tableKey"
      :schema="schema"
      :rows="rows"
      :headers="headers"
      :loading="loadingRows"
      :table-views="true"
      :table-view-tabs="viewTabs"
      :table-views-page="tableViewsPage"
      :table-actions="false"
      :row-actions="false"
      :namespaced="false"
      :search="false"
      :rows-per-page="PER_PAGE"
      key-field="id"
    />
    <p
      v-if="truncated"
      class="wtable__note"
    >
      {{ t('configurableViews.widget.tableTruncated') }}
    </p>
  </WidgetCard>

  <WidgetCard
    v-else
    :title="widget.title"
    :count="widget.title && schema ? count : null"
    :error="schema ? '' : t('configurableViews.widget.noType', { type: widget.resource })"
  >
    <PaginatedResourceTable
      v-if="schema"
      :key="tableKey"
      :schema="schema"
      :headers="headers"
      :pagination-headers="pagedHeaders"
      :context="PAGINATION_CONTEXT"
      :override-in-store="inStore"
      :table-views="true"
      :table-view-tabs="viewTabs"
      :table-views-page="tableViewsPage"
      :table-actions="false"
      :row-actions="false"
      :namespaced="false"
      :search="false"
      :rows-per-page="PER_PAGE"
      key-field="id"
    />
  </WidgetCard>
</template>

<style lang="scss" scoped>
// The table brings its own top margin for the toolbar it is not showing here.
.wcard :deep(.sortable-table-header) {
  margin-bottom: 0;
}

.wtable__note {
  color:       var(--muted);
  font-size:   12px;
  line-height: 1.35;
  margin:      8px 0 0;
}
</style>
