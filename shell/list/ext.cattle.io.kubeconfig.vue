<script lang="ts">
import { defineComponent } from 'vue';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';

export default defineComponent({
  name: 'KubeconfigList',

  components: { PaginatedResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    canViewProvClusters(): boolean {
      return !!this.$store.getters['management/canList'](CAPI.RANCHER_CLUSTER);
    },
    canViewMgmtClusters(): boolean {
      return !!this.$store.getters['management/canList'](MANAGEMENT.CLUSTER);
    }
  },

  methods: {
    /**
     * Fetch all clusters when not using pagination
     */
    async fetchSecondaryResources({ canPaginate }: PagTableFetchSecondaryResourcesOpts): PagTableFetchSecondaryResourcesReturns {
      if (canPaginate) {
        return;
      }

      const promises = [];

      if (this.canViewProvClusters) {
        promises.push(this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }));
      }

      if (this.canViewMgmtClusters) {
        promises.push(this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }));
      }

      await Promise.all(promises);
    },

    /**
     * Fetch only the clusters referenced by kubeconfigs on the current page
     *
     * NOTE: For the time being this isn't validated because ext.cattle.io.kubeconfig is not one of the indexed resources. I'm putting this in for future support since secondary resources are needed.
     */
    async fetchPageSecondaryResources({ force, page }: PagTableFetchPageSecondaryResourcesOpts) {
      if (!page?.length) {
        return;
      }

      const uniqueClusterIds = new Set<string>();

      page.forEach((kubeconfig: any) => {
        const ids = kubeconfig.spec?.clusters || [];

        ids.forEach((id: string) => uniqueClusterIds.add(id));
      });

      if (uniqueClusterIds.size === 0) {
        return;
      }

      const clusterIdArray = Array.from(uniqueClusterIds);

      if (this.canViewProvClusters) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(
              clusterIdArray.map((id) => new PaginationFilterField({
                field: 'status.clusterName', // Verified it's one of the attribute fields listed in the schema, according to steve-pagination-utils that means it should be filterable
                value: id
              }))
            )
          })
        };

        this.$store.dispatch('management/findPage', { type: CAPI.RANCHER_CLUSTER, opt });
      }

      if (this.canViewMgmtClusters) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(
              clusterIdArray.map((id) => new PaginationFilterField({
                field: 'metadata.name', // Verified it's one of the attribute fields listed in the schema, according to steve-pagination-utils that means it should be filterable
                value: id
              }))
            )
          })
        };

        this.$store.dispatch('management/findPage', { type: MANAGEMENT.CLUSTER, opt });
      }
    }
  }
});
</script>

<template>
  <PaginatedResourceTable
    :schema="schema"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :fetch-secondary-resources="fetchSecondaryResources"
    :fetch-page-secondary-resources="fetchPageSecondaryResources"
  />
</template>
