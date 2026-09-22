<script>
import ResourceTable from '@shell/components/ResourceTable.vue';
import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import { filterBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';

// Shorthand column names the template JSON can use instead of a full header object.
const COLUMN_SHORTHANDS = {
  state:     STATE,
  name:      NAME,
  namespace: NAMESPACE,
  age:       AGE,
};

// Config-driven list widget.
//
// Widget spec:
//   {
//     type:     'resourceList',
//     resource: 'pod',
//     title:    'Frontend Pods',
//     columns:  ['state', 'name', 'namespace',
//                { name: 'node', value: 'spec.nodeName', label: 'Node' }, 'age'],
//     filters:  {
//       labelSelector: 'tier=frontend',        // server-side (Kubernetes selector string)
//       namespaces:    ['default', 'web'],      // client-side, in-set
//       fieldMatch:    { 'status.phase': 'Running' }, // client-side, dotted path == value
//       search:        'nginx'                   // client-side name contains
//     }
//   }
//
// We fetch ourselves (server-filtering by labelSelector where given) and hand the rows
// + resolved headers to the purely-presentational ResourceTable.
export default {
  name:       'TemplateResourceList',
  components: { ResourceTable },

  props: {
    widget: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.loading = true;

    try {
      if (!this.schema) {
        this.rows = [];

        return;
      }

      const selector = this.widget.filters?.labelSelector;

      if (selector) {
        // Server-side label-selector fetch (string selector). transient => returns the
        // array directly rather than caching under the unfiltered "haveAll".
        this.rows = await this.$store.dispatch(`${ this.inStore }/findMatching`, {
          type: this.widget.resource,
          selector,
          opt:  { transient: true },
        });
      } else {
        this.rows = await this.$store.dispatch(`${ this.inStore }/findAll`, { type: this.widget.resource });
      }
    } finally {
      this.loading = false;
    }
  },

  data() {
    return { rows: [], loading: true };
  },

  computed: {
    inStore() {
      return this.$store.getters['currentStore'](this.widget.resource);
    },

    schema() {
      return this.$store.getters[`${ this.inStore }/schemaFor`](this.widget.resource);
    },

    title() {
      return this.widget.title || this.widget.resource;
    },

    headers() {
      const columns = this.widget.columns;

      // No columns specified -> default columns for this resource type.
      if (!columns?.length) {
        return this.$store.getters['type-map/headersFor'](this.schema);
      }

      return columns.map((col) => {
        if (typeof col === 'string') {
          return COLUMN_SHORTHANDS[col] || {
            name: col, label: col, value: col, sort: col
          };
        }

        // Full header object from JSON. Ensure it has a `name` (SortableTable key).
        return { name: col.name || col.value || col.label, ...col };
      });
    },

    filteredRows() {
      let rows = this.rows || [];
      const filters = this.widget.filters || {};

      if (filters.namespaces?.length) {
        rows = rows.filter((row) => filters.namespaces.includes(row.metadata?.namespace));
      }

      if (filters.fieldMatch) {
        rows = filterBy(rows, filters.fieldMatch);
      }

      if (filters.search) {
        const needle = `${ filters.search }`.toLowerCase();

        rows = rows.filter((row) => `${ row.nameDisplay || get(row, 'metadata.name') || '' }`.toLowerCase().includes(needle));
      }

      return rows;
    },
  },
};
</script>

<template>
  <div class="template-resource-list mb-40">
    <h3 class="mb-10">
      {{ title }}
    </h3>
    <ResourceTable
      v-if="schema"
      :schema="schema"
      :rows="filteredRows"
      :headers="headers"
      :loading="loading"
    />
    <div
      v-else
      class="text-error"
    >
      No schema found for "{{ widget.resource }}" — the type may not be loaded or you may lack permission.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.template-resource-list {
  h3 {
    font-weight: 600;
  }
}
</style>
