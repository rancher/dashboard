<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { fetchNodesForServiceTargets } from '@shell/models/service';

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
      // Nodes should be fetched because they may be referenced in the target column of a service list item.
      await fetchNodesForServiceTargets({
        $store:  this.$store,
        inStore: this.$store.getters['currentStore']()
      });
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
