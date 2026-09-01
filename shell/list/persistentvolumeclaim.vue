<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';

export default {
  name:       'ListPersistentVolumeClaim',
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

};
</script>

<template>
  <PaginatedResourceTable
    :schema="schema"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
