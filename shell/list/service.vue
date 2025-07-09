<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { NODE } from '@shell/config/types';

export default {
  name:       'ListService',
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
      const inStore = this.$store.getters['currentStore']();

      if (this.$store.getters[`${ inStore }/schemaFor`](NODE)) {
        // fetch nodes before loading this page, as they may be referenced in the Target table column
        // shell/components/formatter/ServiceTargets.vue --> shell/components/formatter/Endpoints.vue --> Picks the first one that has a model's externalIp
        await this.$store.dispatch(`${ inStore }/findAll`, { type: NODE });
      }
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
