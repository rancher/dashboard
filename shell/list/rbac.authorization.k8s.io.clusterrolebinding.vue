<script>
import ResourceTable from '@shell/components/ResourceTable';

export default {
  name:       'ListNamespace',
  components: { ResourceTable },
  props:      {
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

  $loadingResources() {
    return { loadIndeterminate: true };
  },
};
</script>

<template>
  <div>
    <ResourceTable
      v-bind="$attrs"
      :rows="rows"
      :groupable="false"
      :schema="schema"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>
