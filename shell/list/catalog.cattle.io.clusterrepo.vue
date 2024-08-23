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
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    rows: {
      type:     Array,
      required: true,
    },
    loading: {
      type:     Boolean,
      required: false,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  methods: {
    filterRowsLocal(rows: ClusterRepo[]) {
      // TODO: RC Test
      return rows.filter((repo) => !(repo?.metadata?.annotations?.[CATALOG_ANNOTATIONS.HIDDEN_REPO] === 'true'));
    },

    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      // TODO: RC Test once API updated
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const field = `metadata.annotations."${ CATALOG_ANNOTATIONS.HIDDEN_REPO }"`;
      const required = PaginationParamFilter.createSingleField({
        field,
        exact:  true,
        value:  'true',
        equals: true
      });
      let existing: PaginationParamFilter | null = null;

      for (let i = 0; i < pagination.filters.length; i++) {
        const filter = pagination.filters[i];

        if (!!filter.fields.find((f) => f.field === field)) {
          existing = filter;
          break;
        }
      }

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
