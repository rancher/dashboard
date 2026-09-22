<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import WidgetCard from './WidgetCard.vue';
import {
  applyFilter, applySort, fieldValue, fieldLabel, storeForType, typeColumns, withoutDetailLink,
  fetchClusterPage
} from '../../templating/widget-data';
import { isDownstream } from '../../templating/widget-catalog';

// TABLE — "Rows of a resource with the columns you pick".
//
// Rendered by Rancher's PaginatedResourceTable, which is the component built for exactly this:
// "ResourceList like capabilities outside of List pages", its own words — the resource fetch,
// SERVER-SIDE pagination where the backend supports it, and the plumbing that goes with them. So
// this widget does not fetch at all; it says what to show and hands the rest over.
//
// That is why the widget's own Where/Filter/Sort arrive as `localFilter`: the table owns the rows,
// and a filter is something applied to them on the way past, not a reason to fetch them ourselves.
//
// It is KEYED on the resource. The table fetches for the schema it was built with and does not
// re-fetch when that prop changes, so pointing a widget at a different type left the old type's
// rows on screen until a reload. Keying it makes a new resource a new table. The sort is in the key
// for the same reason: a column's default sort is read once, when the table is built.
//
// Columns come from the RESOURCE first: Rancher defines real headers per type, so a User gets a
// username and a last login while a Cluster gets a provider and a Kubernetes version, each with its
// proper formatter and sort. Only where the type declares nothing does this fall back to a generic
// header, and then to a value column on this extension's own field readers — which is what keeps an
// arbitrary CRD field working.
//
// Rancher's NAME column links into the resource's detail page, which needs a cluster context the
// Home does not have; the link silently renders nothing. The stock Home's own cluster table drops
// the same formatter for the same reason (see withoutDetailLink for the type's own headers).
const { formatter, ...NAME_NO_LINK } = NAME;

const GENERIC_HEADERS = {
  state:     STATE,
  name:      NAME_NO_LINK,
  namespace: NAMESPACE,
  created:   AGE,
};

export default {
  name:       'WidgetTable',
  components: {
    PaginatedResourceTable, ResourceTable, WidgetCard
  },

  props: {
    widget: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      rows:        [],
      pageCount:   0,
      truncated:   false,
      serverPaged: false,
      loadingPage: false,
      pageError:   '',
      page:        1,
      // The last request actually made, so the same one is not made three times over (see loadPage).
      lastKey:     '',
    };
  },

  computed: {
    // A Kubernetes type lives once PER CLUSTER, so it is read from a named cluster rather than from
    // the global API. That is a different fetch, a different table, and a question the settings
    // panel has to have asked.
    downstream() {
      return isDownstream(this.widget.resource);
    },

    cluster() {
      return this.widget.cluster || '';
    },

    // A filter is applied here rather than by the API, so it changes HOW the rows are fetched.
    filtered() {
      return !!this.widget.filter || (this.widget.where === 'custom' && !!this.widget.targets?.length);
    },

    /**
     * Everything the request depends on, except which page. When this changes the widget is asking
     * a different question, so the answer starts again at page one.
     */
    queryKey() {
      return JSON.stringify([this.widget.resource, this.cluster, this.widget.sortBy, this.widget.sortDir, this.filtered]);
    },

    inStore() {
      return storeForType(this.$store.getters, this.widget.resource);
    },

    schema() {
      return this.widget.resource ? this.$store.getters[`${ this.inStore }/schemaFor`](this.widget.resource) : null;
    },

    // What the type itself declares, keyed by column id.
    typeHeaders() {
      return Object.fromEntries(typeColumns(this.$store.getters, this.widget.resource).map((c) => [c.id, c.header]));
    },

    // Nothing chosen means EVERYTHING the type has — the same columns its own list page shows.
    // Starting from all of them and unticking is less work than hunting for the ones you want.
    defaultColumns() {
      const own = Object.keys(this.typeHeaders);

      return own.length ? own : ['state', 'name'];
    },

    headers() {
      const ids = this.widget.columns?.length ? this.widget.columns : this.defaultColumns;

      return ids.map((id) => {
        const header = this.headerFor(id);

        // Sorting goes through the COLUMN wherever the column can do it: the header knows which
        // path it really sorts on, which a field reader never taught this type cannot. Marking the
        // header is how SortableTable is told to open that way — it has no prop for the direction.
        if (id === this.widget.sortBy && header.sort) {
          return {
            ...header, defaultSort: true, defaultSortDescending: this.widget.sortDir === 'desc'
          };
        }

        return header;
      });
    },

    // True when the table is sorting for us, and this widget must not sort on top of it.
    sortsItself() {
      return this.headers.some((h) => h.defaultSort);
    },

    // The table pages for us, so the spec's limit is a page size rather than a hard cut.
    perPage() {
      return this.widget.limit || 10;
    },

    /**
     * The rows the downstream table draws.
     *
     * `local-filter` belongs to the resource-fetch MIXIN, not to ResourceTable — passing it to a
     * bare table does nothing at all. The filter is applied here instead, which is also why a
     * filtered widget is fetched whole (see fetchClusterPage): you cannot filter rows you never
     * asked for.
     */
    visibleRows() {
      return this.filterRows(this.rows);
    },

    // External pagination means "the rows you were handed ARE the page" — the table shows them all
    // and trusts the count. That is true of a single cluster, where the backend sliced the page, and
    // false of a merge, where we hold every row: there the table must do its own paging or it draws
    // all 144 of them under a footer claiming 11-20.
    externalResult() {
      return { count: this.pageCount };
    },

    downstreamMessage() {
      if (!this.cluster) {
        return 'Choose a cluster in this widget\u2019s settings — a Kubernetes type lives once per cluster.';
      }

      return this.pageError;
    },
  },

  watch: {
    queryKey() {
      this.page = 1;
      this.loadPage();
    },
  },

  created() {
    if (this.downstream) {
      this.loadPage();
    }
  },

  methods: {
    /**
     * Fetch the page the widget should be showing.
     *
     * THREE different things ask for it whenever a widget appears or is changed, and each is right
     * to: the component's own created hook, the watcher on what the widget asks for, and
     * SortableTable, which emits `pagination-changed` when it mounts. Three requests for the same
     * rows — the table would fill, blank and fill again. So the request is keyed by everything it
     * depends on and an identical one is simply not repeated; a failed one clears the key, because
     * the next ask should be a real retry rather than a silent no-op.
     */
    async loadPage(pagination) {
      if (!this.downstream) {
        return;
      }

      const page = pagination?.page || this.page;
      const pageSize = pagination?.perPage || this.perPage;
      const key = `${ this.queryKey }|${ page }|${ pageSize }`;

      if (key === this.lastKey) {
        return;
      }

      this.lastKey = key;
      this.page = page;
      this.loadingPage = true;
      this.pageError = '';

      try {
        const res = await fetchClusterPage(this.$store, {
          resource: this.widget.resource,
          cluster:  this.cluster,
          page,
          pageSize,
          sortBy:   this.widget.sortBy,
          sortDir:  this.widget.sortDir,
          filtered: this.filtered,
        });

        this.rows = res.rows;
        this.pageCount = res.count;
        this.truncated = res.truncated;
        this.serverPaged = res.serverPaged;
      } catch (e) {
        this.rows = [];
        this.pageCount = 0;
        this.lastKey = '';
        this.pageError = e?.message || `Could not read ${ this.widget.resource } from that cluster.`;
      } finally {
        this.loadingPage = false;
      }
    },

    headerFor(id) {
      const own = this.typeHeaders[id];

      if (own) {
        return withoutDetailLink(own);
      }

      return GENERIC_HEADERS[id] || {
        name:   id,
        label:  fieldLabel(id),
        value:  (row) => this.cell(row, id),
        sort:   false,
        search: false,
      };
    },

    cell(row, id) {
      const value = fieldValue(row, id);

      return value === '' || value === null || value === undefined ? '—' : value;
    },

    // Applied to whichever rows the table has, however it got them.
    filterRows(rows) {
      const scoped = this.widget.where === 'custom' && this.widget.targets?.length ? (rows || []).filter((row) => this.inTargets(row)) : rows;
      const filtered = applyFilter(scoped, this.widget.filter);

      return this.sortsItself ? filtered : applySort(filtered, this.widget.sortBy, this.widget.sortDir);
    },

    inTargets(row) {
      const targets = this.widget.targets.map((t) => t.toLowerCase());
      const candidates = [fieldValue(row, 'namespace'), row.clusterName, row.spec?.clusterName].filter(Boolean);

      return candidates.some((c) => targets.includes(`${ c }`.toLowerCase()));
    },
  },
};
</script>

<template>
  <!-- A type read from a named cluster: we fetch the page ourselves, because the cluster is not
     something PaginatedResourceTable can be told about. -->
  <WidgetCard
    v-if="downstream"
    :title="widget.title"
    :loading="loadingPage && !rows.length"
    :error="downstreamMessage"
  >
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
      This cluster has more rows than a filtered widget reads at once, so the filter was applied to
      the first of them. Narrow the filter, or drop it to page through all of them.
    </p>
  </WidgetCard>

  <WidgetCard
    v-else
    :title="widget.title"
    :error="schema ? '' : `Rancher has no &quot;${ widget.resource }&quot; here — the type may not be installed, or you may not have permission to see it.`"
  >
    <PaginatedResourceTable
      v-if="schema"
      :key="`${ widget.resource }|${ widget.sortBy }|${ widget.sortDir }`"
      :schema="schema"
      :headers="headers"
      :pagination-headers="headers"
      :override-in-store="inStore"
      :local-filter="filterRows"
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
