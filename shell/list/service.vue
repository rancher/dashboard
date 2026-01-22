<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import { NODE } from '@shell/config/types';
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
