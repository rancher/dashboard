<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import { MANAGEMENT } from '@shell/config/types';
import type { PaginationArgs } from '@shell/types/store/pagination.types';
import WidgetCard from './WidgetCard.vue';
import {
  applyFilter, applySort, fieldValue, fieldLabelKey, storeForType, typeColumns, withoutDetailLink,
  steveFilters, steveSortField, type Header
} from '../../templating/widget-data';
import { isDownstream, PAGINATION_CONTEXT } from '../../templating/widget-catalog';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { useClusterPage } from '../../composables/useClusterPage';
import { useSharedTypeList } from '../../composables/useSharedTypeList';
import type { ResourceRow, WidgetSpec } from '../../templating/types';

// TABLE — "Rows of a resource with the columns you pick".
//
// A GLOBAL type is rendered by Rancher's PaginatedResourceTable, the component built for exactly
// this: "ResourceList like capabilities outside of List pages", its own words — the fetch,
// SERVER-SIDE pagination where the backend supports it, and the plumbing that goes with them. A
// type that lives once PER CLUSTER is read from the cluster the widget names instead (see
// useClusterPage), because that table can only be pointed at the cluster that is open.
//
// The widget's Filter goes INTO the request where the API can apply it (see apiFilters): then the
// backend narrows and pages, and the table only ever holds one page. Where it cannot - a
// comparison, a computed field, the "only these clusters" scope - the widget withdraws its paging
// context and the table falls back to the whole collection, filtered here through `localFilter`.
// Never half of each: see steveFilters for why.
//
// It is KEYED on what it asks for (see tableKey). The table fetches for the schema it was built
// with and does not re-fetch when that prop changes, so pointing a widget at a different type left
// the old type's rows on screen until a reload. Keying it makes a new question a new table.
//
// Columns come from the RESOURCE first: Rancher defines real headers per type, so a User gets a
// username and a last login while a Cluster gets a provider and a Kubernetes version, each with its
// proper formatter and sort. Only where the type declares nothing does this fall back to a generic
// header, and then to a value column on this package's own field readers — which is what keeps an
// arbitrary CRD field working.
//
// Rancher's NAME column links into the resource's detail page, which needs a cluster context the
// Home does not have; the link silently renders nothing. The stock Home's own cluster table drops
// the same formatter for the same reason (see withoutDetailLink for the type's own headers).
const { formatter, ...NAME_NO_LINK } = NAME;

const GENERIC_HEADERS: Record<string, Header> = {
  state:     STATE,
  name:      NAME_NO_LINK,
  namespace: NAMESPACE,
  created:   AGE,
};

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

// A Kubernetes type lives once PER CLUSTER, so it is read from a named cluster rather than from the
// global API. That is a different fetch, a different table, and a question the settings have to
// have asked.
const downstream = computed(() => isDownstream(props.widget.resource));

// "Only these clusters or namespaces" is matched against several fields at once (see inTargets),
// which the API has no single field for - so it is applied to the rows, and a widget that uses it is
// not paged.
const scoped = computed(() => props.widget.where === 'custom' && !!props.widget.targets?.length);

/**
 * The widget's filter as something the API can apply, or null when it cannot apply it.
 *
 * This one value decides how the widget works. Non-null and the request is narrowed and paged by
 * the backend; null and we are back to holding the whole collection and filtering it here.
 */
const apiFilters = computed(() => (scoped.value ? null : steveFilters(props.widget.filter)));

// True when the widget's filter has to be applied HERE - which changes how the rows are fetched:
// all of them, not a page.
const filtered = computed(() => apiFilters.value === null);

/**
 * What turns SERVER-SIDE pagination on - and it is a context, not a flag.
 *
 * The store enables paging per resource per context, and index.ts registers this package's own. So
 * paging is on for these widgets and for nothing else: no list page elsewhere in Rancher changes
 * behaviour because a Home has a table on it.
 *
 * Null withdraws the context, and with it server-side paging, which is exactly what a filter the API
 * cannot apply needs - the table then fetches the collection and `localFilter` runs. Both halves
 * have to move together: `localFilter` is ignored while paging is on, and `apiFilter` while it is off.
 */
const paginationContext = computed(() => (apiFilters.value ? PAGINATION_CONTEXT : null));

const inStore = computed(() => storeForType(store.getters, props.widget.resource));

const schema = computed(() => (props.widget.resource ? store.getters[`${ inStore.value }/schemaFor`](props.widget.resource) : null));

// What the type itself declares, keyed by column id.
const typeHeaders = computed<Record<string, Header>>(() => Object.fromEntries(typeColumns(store.getters, props.widget.resource).map((c) => [c.id, c.header])));

// Nothing chosen means EVERYTHING the type has — the same columns its own list page shows. Starting
// from all of them and unticking is less work than hunting for the ones you want.
const defaultColumns = computed(() => {
  const own = Object.keys(typeHeaders.value);

  return own.length ? own : ['state', 'name'];
});

function cell(row: ResourceRow, id: string): unknown {
  const value = fieldValue(row, id);

  return value === '' || value === null || value === undefined ? '—' : value;
}

function headerFor(id: string): Header {
  const own = typeHeaders.value[id];

  if (own) {
    return withoutDetailLink(own);
  }

  // A field of our own: readable, but not sortable - no `sort` is what tells the table so.
  return GENERIC_HEADERS[id] || {
    name:   id,
    label:  fieldLabelKey(id) ? t(fieldLabelKey(id)) : id,
    value:  (row: ResourceRow) => cell(row, id),
    search: false,
  };
}

const headers = computed<(Header & { defaultSort?: boolean; defaultSortDescending?: boolean })[]>(() => {
  const ids = props.widget.columns?.length ? props.widget.columns : defaultColumns.value;

  return ids.map((id) => {
    const header = headerFor(id);

    // Sorting goes through the COLUMN wherever the column can do it: the header knows which path it
    // really sorts on, which a field reader never taught this type cannot. Marking the header is how
    // SortableTable is told to open that way — it has no prop for the direction.
    if (id === props.widget.sortBy && header.sort) {
      return {
        ...header, defaultSort: true, defaultSortDescending: props.widget.sortDir === 'desc'
      };
    }

    return header;
  });
});

// True when the table is sorting for us, and this widget must not sort on top of it.
const sortsItself = computed(() => headers.value.some((h) => h.defaultSort));

/**
 * The same columns, told what the API calls them.
 *
 * A client-side header sorts on a name only this package understands (`nameSort`). Sent to Steve
 * that is a column it has never heard of, and the whole request comes back 422 - so a column whose
 * sort cannot be translated is marked unsortable rather than left to break.
 */
const paginationHeaders = computed(() => headers.value.map((header) => {
  const field = steveSortField(store.getters, props.widget.resource, header.name);

  return field ? {
    ...header, sort: [field], search: field
  } : {
    ...header, sort: undefined, search: false
  };
}));

/**
 * What rebuilds the global table.
 *
 * The table asks the API once, when it is built, and after that only when its OWN paging or sorting
 * changes - it has no idea the widget's settings exist. So everything the request is made of goes in
 * here, and changing any of it builds a new table that asks again: the type, the sort (read once, as
 * the column's default), and the filter, which is part of the request rather than something applied
 * to rows afterwards.
 */
// Rebuilt, too, when another table of the same global type leaves the page (see useSharedTypeList).
const shared = useSharedTypeList(() => (!downstream.value && props.widget.resource ? `${ inStore.value }/${ props.widget.resource }` : null));

const tableKey = computed(() => JSON.stringify([
  props.widget.resource, props.widget.sortBy, props.widget.sortDir, props.widget.filter || '', scoped.value ? props.widget.targets : [], paginationContext.value, shared.value
]));

// The table pages for us, so the spec's limit is a page size rather than a hard cut.
const perPage = computed(() => props.widget.limit || 10);

// ---- a per-cluster type -----------------------------------------------------------------------------

const {
  rows, count: pageCount, loading: loadingPage, error: pageError, truncated, serverPaged, load: loadPage
} = useClusterPage(() => ({
  resource: props.widget.resource,
  // A global type is not read here at all - its table fetches for itself.
  cluster:  downstream.value ? cluster.value : '',
  perPage:  perPage.value,
  sortBy:   props.widget.sortBy,
  sortDir:  props.widget.sortDir,
  filters:  apiFilters.value || [],
  filtered: filtered.value,
}));

// A per-cluster type's rows all come from the widget's cluster, which no field on them names - so a
// target naming that cluster, by id or by the name it is shown under, takes every one of them.
const ownCluster = computed(() => {
  if (!downstream.value || !cluster.value) {
    return [];
  }

  const shown = store.getters['management/byId'](MANAGEMENT.CLUSTER, cluster.value)?.nameDisplay;

  return [cluster.value, shown].filter(Boolean);
});

function inTargets(row: ResourceRow): boolean {
  const targets = props.widget.targets.map((t) => t.toLowerCase());
  const candidates = [fieldValue(row, 'namespace'), row.clusterName, row.spec?.clusterName, ...ownCluster.value].filter(Boolean);

  return candidates.some((c) => targets.includes(`${ c }`.toLowerCase()));
}

// Applied to whichever rows the table has, however it got them.
function filterRows<T extends ResourceRow>(list: T[]): T[] {
  const inScope = scoped.value ? (list || []).filter(inTargets) : list;
  const narrowed = applyFilter(inScope, props.widget.filter);

  return sortsItself.value ? narrowed : applySort(narrowed, props.widget.sortBy, props.widget.sortDir);
}

/**
 * The rows the per-cluster table draws.
 *
 * `local-filter` belongs to the resource-fetch MIXIN, not to ResourceTable — passing it to a bare
 * table does nothing at all. So it is applied here. Rows the API filtered are not filtered again:
 * its partial match and ours are not the same function, and a second pass would quietly drop rows
 * the first one returned.
 */
const visibleRows = computed(() => (filtered.value ? filterRows(rows.value) : rows.value));

// External pagination means "the rows you were handed ARE the page" — the table shows them all and
// trusts the count. That is true when the server cut the page, and false when we hold every row:
// there the table must do its own paging, or it draws all of them under a footer claiming 11-20.
const externalResult = computed(() => ({ count: pageCount.value }));

/**
 * The count beside the title, as a list's heading shows it: how many rows the widget shows, across
 * every page.
 *
 * From a named cluster, the server's total for the filter - or, when the widget filters the rows
 * itself, how many passed. For a global type, the total the store kept with the page it last asked
 * for (the filter already applied by the API), or, when it holds every row, how many pass the filter.
 */
const count = computed<number | null>(() => {
  if (downstream.value) {
    return filtered.value ? visibleRows.value.length : pageCount.value;
  }

  if (!schema.value) {
    return null;
  }

  const page = store.getters[`${ inStore.value }/havePage`]?.(props.widget.resource);

  if (typeof page?.result?.count === 'number') {
    return page.result.count;
  }

  return filterRows(store.getters[`${ inStore.value }/all`]?.(props.widget.resource) || []).length;
});

const downstreamMessage = computed(() => (cluster.value ? pageError.value : t(NO_CLUSTER)));

/**
 * Add the widget's own filter to the request the table is about to make.
 *
 * MUTATES, and deliberately: the caller assigns this function's return value somewhere it never
 * reads (`opt.paginating`), so every other apiFilter in the codebase changes the object in place.
 * Returning a new one here would be silently dropped.
 */
function applyApiFilter(pagination: PaginationArgs): PaginationArgs {
  if (apiFilters.value?.length) {
    pagination.filters = [...(pagination.filters || []), ...apiFilters.value];
  }

  return pagination;
}
</script>

<template>
  <WidgetCard
    v-if="downstream"
    :title="widget.title"
    :count="widget.title ? count : null"
    :loading="loadingPage && !rows.length"
    :error="downstreamMessage"
  >
    <!-- A type read from a named cluster: we fetch the page ourselves, because the cluster is not
       something PaginatedResourceTable can be told about. -->
    <ResourceTable
      :schema="schema"
      :rows="visibleRows"
      :headers="headers"
      :loading="loadingPage"
      :external-pagination-enabled="serverPaged"
      :external-pagination-result="externalResult"
      :table-actions="false"
      :row-actions="false"
      :namespaced="false"
      :groupable="false"
      :search="false"
      :rows-per-page="perPage"
      key-field="id"
      @pagination-changed="loadPage"
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
      :pagination-headers="paginationHeaders"
      :context="paginationContext"
      :override-in-store="inStore"
      :local-filter="filterRows"
      :api-filter="applyApiFilter"
      :table-actions="false"
      :row-actions="false"
      :namespaced="false"
      :groupable="false"
      :search="false"
      :rows-per-page="perPage"
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
