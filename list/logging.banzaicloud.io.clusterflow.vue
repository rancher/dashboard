<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { LOGGING } from '@/config/types';

export default {
  name:       'ListApps',
  components: { Loading, ResourceTable },

  props: {
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
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  data() {
    return { rows: null };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" />
</template>
