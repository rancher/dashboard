<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';

export default {
  components: { PaginatedResourceTable },
  props:      {
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
    /**
     * of type PagTableFetchSecondaryResources
     */
    async fetchSecondaryResources(opts) {
      // pathExistsInSchema requires schema networking.k8s.io.ingress to have resources fields via schema definition but none were found. has the schema 'fetchResourceFields' been called?
      await this.schema.fetchResourceFields();
    }
  }
};
</script>

<template>
  <PaginatedResourceTable
    :schema="schema"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :fetchSecondaryResources="fetchSecondaryResources"
  />
</template>
