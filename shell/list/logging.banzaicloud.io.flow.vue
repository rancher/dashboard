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
    try {
      await this.$store.dispatch('cluster/findAll', { type: LOGGING.OUTPUT });
      await this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_OUTPUT });
    } catch (e) {}
    const rows = await this.$fetchType(LOGGING.FLOW);

    this.rows = rows;
  },

  data() {
    return { rows: [] };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" />
</template>
