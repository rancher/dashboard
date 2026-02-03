<script>
import ResourceTable from '@shell/components/ResourceTable';
import { EXT } from '@shell/config/types';

export default {
  name: 'KubeconfigList',

  components: { ResourceTable },

  props: {
    rows: {
      type:     Array,
      required: true
    },

    schema: {
      type:     Object,
      required: true
    },

    loading: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { resource: EXT.KUBECONFIG };
  }
};
</script>

<template>
  <ResourceTable
    :rows="rows"
    :schema="schema"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
