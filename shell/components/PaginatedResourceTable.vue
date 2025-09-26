<script lang="ts">
import { defineComponent } from 'vue';
import ResourceFetch from '@shell/mixins/resource-fetch';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { VuexStore } from '@shell/types/store/vuex';

/**
 * This is meant to enable ResourceList like capabilities outside of List pages / components
 *
 * Specifically
 * - Resource Fetch features, including server-side pagination
 * - Some plumbing
 *
 * This avoids polluting the owning component with mixins
 *
 */
export default defineComponent({
  name: 'PaginatedResourceTable',

  components: { ResourceTable },

  mixins: [ResourceFetch],

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    headers: {
      type:    Array,
      default: null,
    },

    paginationHeaders: {
      type:    Array,
      default: null,
    },

    groupTooltip: {
      type:    String,
      default: 'resourceTable.groupBy.namespace',
    },

    /**
     * Field to group rows by, row[groupBy] must be something that can be a map key (or also use groupSort)
     */
    groupBy: {
      type:    String,
      default: null,
    },

    /**
     * Field to order groups by, defaults to groupBy
     */
    groupSort: {
      type:    String,
      default: null
    },

    /**
     * Override any product based group options
     */
    groupOptions: {
      type:    Array,
      default: null
    },

    groupable: {
      type:    Boolean,
      default: null, // Null: auto based on namespaced and type custom groupings
    },

    namespaced: {
      type:    Boolean,
      default: null, // Automatic from schema
    },

    /**
     * Information may be required from resources other than the primary one shown per row
     *
     * This will fetch them ALL and will be run in a non-server-side pagination world
     *
     * of type PagTableFetchSecondaryResources
     */
    fetchSecondaryResources: {
      type:    Function,
      default: null,
    },

    /**
     * Use this store instead of the store `inStore` getters
     */
    overrideInStore: {
      type:    String,
      default: undefined,
    },

    /**
     * Information may be required from resources other than the primary one shown per row
     *
     * This will fetch only those relevant to the current page using server-side pagination based filters
     *
     * called from shell/mixins/resource-fetch-api-pagination.js
     *
     * of type PagTableFetchPageSecondaryResources
     */
    fetchPageSecondaryResources: {
      type:    Function,
      default: null,
    }
  },

  data() {
    return { resource: this.schema.id };
  },

  async fetch() {
    const promises = [
      this.$fetchType(this.resource, [], this.overrideInStore || this.inStore),
    ];

    if (this.fetchSecondaryResources) {
      promises.push(this.fetchSecondaryResources({ canPaginate: this.canPaginate }));
    }

    await Promise.all(promises);
  },

  computed: {
    safeHeaders(): any[] {
      const customHeaders: any[] = this.canPaginate ? this.paginationHeaders : this.headers;

      const $store = this.$store as VuexStore;

      return customHeaders || $store.getters['type-map/headersFor'](this.schema, this.canPaginate);
    }
  },

  methods: {
    clearSelection() {
      const table = this.$refs.table as { clearSelection: () => void };

      table.clearSelection();
    },
  }
});

</script>

<template>
  <div>
    <ResourceTable
      ref="table"
      v-bind="$attrs"
      :schema="schema"
      :rows="rows"
      :alt-loading="canPaginate && !isFirstLoad"
      :loading="loading"

      :group-by="groupBy"
      :group-sort="groupSort"
      :groupable="groupable"
      :groupTooltip="groupTooltip"
      :groupOptions="groupOptions"

      :override-in-store="overrideInStore"

      :headers="safeHeaders"
      :namespaced="namespaced"

      :external-pagination-enabled="canPaginate"
      :external-pagination-result="paginationResult"

      @pagination-changed="paginationChanged"
    >
      <!-- Pass down templates provided by the caller -->
      <template
        v-for="(_, slot) of $slots"
        v-slot:[slot]="scope"
        :key="slot"
      >
        <slot
          :name="slot"
          v-bind="scope"
        />
      </template>
    </ResourceTable>
  </div>
</template>
