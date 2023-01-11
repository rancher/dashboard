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
    this.$initializeFetchData(this.resource);
    this.$fetchType(LOGGING.CLUSTER_OUTPUT);

    await this.$fetchType(this.resource);
  }
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  />
</template>
