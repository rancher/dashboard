<script>
import PaginationResourceTable from '@shell/components/PaginatedResourceTable';

export default {
  components: { PaginationResourceTable },
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
     * opts: FetchSecondaryResourcesOpts
     */
    async fetchSecondaryResources(opts) {
      // pathExistsInSchema requires schema networking.k8s.io.ingress to have resources fields via schema definition but none were found. has the schema 'fetchResourceFields' been called?
      await this.schema.fetchResourceFields();
    }
  }
};
</script>

<template>
  <PaginationResourceTable
    :schema="schema"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"

    :fetchSecondaryResources="fetchSecondaryResources"
  />
</template>
