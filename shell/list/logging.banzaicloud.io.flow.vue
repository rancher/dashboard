<script>
import ResourceTable from '@shell/components/ResourceTable';
import { LOGGING } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
export default {
  name:       'ListApps',
  components: { ResourceTable },
  mixins:     [ResourceFetch],
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

  async fetch() {
    try {
      await this.$store.dispatch('cluster/findAll', { type: LOGGING.OUTPUT });
      await this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_OUTPUT });
    } catch (e) {}

    await this.$fetchType(LOGGING.FLOW);
  }
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
