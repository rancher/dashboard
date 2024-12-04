<script lang="ts">
import { defineComponent } from 'vue';
import PaginatedResourceTable, { FetchPageSecondaryResourcesOpts } from '@shell/components/PaginatedResourceTable.vue';
import { PVC } from '@shell/config/types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';

export default defineComponent({
  name: 'ListPersistentVolume',

  components: { PaginatedResourceTable },

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  methods: {
    fetchSecondaryResources(): { [key: string]: Promise<any>} {
      return { pvc: this.$store.dispatch(`cluster/findAll`, { type: PVC }) };
    },

    /**
     * PV columns need other resources in order to show data in some columns
     *
     * So when we have a page.... use those entries as filters when fetching the other resources
     */
    async fetchPageSecondaryResources({ canPaginate, force, page }: FetchPageSecondaryResourcesOpts) {
      if (!page?.length) {
        return;
      }

      const opt: ActionFindPageArgs = {
        force,
        pagination: new FilterArgs({
          filters: [],
          // Pending API support https://github.com/rancher/rancher/issues/48103
          // filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
          //   field: 'spec.volumeName',
          //   value: r.metadata.name
          // }))),
        })
      };

      return this.$store.dispatch(`cluster/findPage`, { type: PVC, opt });
    },
  }
});
</script>

<template>
  <PaginatedResourceTable
    :schema="schema"
    :fetchSecondaryResources="fetchSecondaryResources"
    :fetchPageSecondaryResources="fetchPageSecondaryResources"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
