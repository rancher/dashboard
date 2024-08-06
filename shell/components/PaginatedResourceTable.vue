<script lang="ts">
import { defineComponent } from 'vue';
import ResourceFetch from '@shell/mixins/resource-fetch';
import ResourceTable from '@shell/components/ResourceTable.vue';

/**
 * Wraps ResourceTable with the plumbing required to handle Server-Side Pagination (mainly mixins)
 *
 * This can be used in places outside of standard List pages (list nodes, generic list, etc) where paginated lists are required (for example home page)
 *
 */
export default defineComponent({
  name: 'PaginatedResourceTable',

  components: { ResourceTable },

  mixins: [ResourceFetch],

  props: {
    schema: {
      type:    Object,
      default: null,
    },
  }
});

</script>

<template>
  <!-- :schema="provClusterSchema"
    :table-actions="false"
    :row-actions="false"
    key-field="id"
    :rows="kubeClusters"
    :headers="clusterHeaders"
    :loading="!kubeClusters"
    :namespaced="nonStandardNamespaces" -->
  <ResourceTable
    :schema="schema"
    v-bind="$attrs"
    :external-pagination-enabled="canPaginate"
    :external-pagination-result="paginationResult"
    :request-filters="paginationRequestFilters"
    @pagination-changed="paginationChanged"
  >
    <!-- Pass down templates provided by the caller -->
    <template
      v-for="(_, slot) of $scopedSlots"
      v-slot:[slot]="scope"
    >
      <slot
        :name="slot"
        v-bind="scope"
      />
    </template>
  </ResourceTable>
</template>
