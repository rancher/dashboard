<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { LOGGING } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListApps',
  components: { Loading, ResourceTable },
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
  },

  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_OUTPUT });
    this.rows = await this.$fetchType(this.resource);
  },

  data() {
    return { rows: null };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else-if="rows" :schema="schema" :rows="rows" />
</template>
