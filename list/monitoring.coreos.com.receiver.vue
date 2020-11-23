<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { MONITORING } from '@/config/types';

export default {
  name:       'ListReceiver',
  components: { Loading, ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const routes = this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.ROUTE });

    this.rows = await this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.RECEIVER });
    await routes;
  },

  data() {
    return { rows: null };
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" />
</template>
