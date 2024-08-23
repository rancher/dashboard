<script>
import PaginationResourceTable from '@shell/components/PaginatedResourceTable';
import { NODE } from '@shell/config/types';

export default {
  name:       'ListService',
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
      const inStore = this.$store.getters['currentStore']();

      if (this.$store.getters[`${ inStore }/schemaFor`](NODE)) {
        // fetch nodes before loading this page, as they may be referenced in the Target table column
        await this.$store.dispatch(`${ inStore }/findAll`, { type: NODE });
      }
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
