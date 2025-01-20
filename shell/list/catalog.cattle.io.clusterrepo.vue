<script lang="ts">
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import ClusterRepo from '@shell/models/catalog.cattle.io.clusterrepo';
import { PaginationArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ListClusterReposApps',

  components: { PaginatedResourceTable },

  props: {
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
    /**
     * Filter out hidden repos from list of all repos
     */
    filterRowsLocal(rows: ClusterRepo[]) {
      return rows.filter((repo) => !(repo?.metadata?.annotations?.[CATALOG_ANNOTATIONS.HIDDEN_REPO] === 'true'));
    },

    /**
     * Filter out hidden repos via api
     */
    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const field = `metadata.annotations[${ CATALOG_ANNOTATIONS.HIDDEN_REPO }]`;

      let existing: PaginationParamFilter | null = null;

      for (let i = 0; i < pagination.filters.length; i++) {
        const filter = pagination.filters[i];

        if (!!filter.fields.find((f) => f.field === field)) {
          existing = filter;
          break;
        }
      }

      const required = PaginationParamFilter.createSingleField({
        field,
        exact:  true,
        value:  'true',
        equals: false
      });

      if (!!existing) {
        Object.assign(existing, required);
      } else {
        pagination.filters.push(required);
      }

      return pagination;
    }
  }

});
</script>

<template>
  <div>
    <PaginatedResourceTable
      :schema="schema"
      :local-filter="filterRowsLocal"
      :api-filter="filterRowsApi"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      data-testid="app-cluster-repo-list"
    />
  </div>
</template>
