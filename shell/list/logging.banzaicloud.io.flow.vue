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
  },

  async fetch() {
    try {
      await this.$store.dispatch('cluster/findAll', { type: LOGGING.OUTPUT });
      await this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_OUTPUT });
    } catch (e) {}

    await this.$fetchType(LOGGING.FLOW);
  },

  computed: {
    rows() {
      const inStore = this.$store.getters['currentStore'](LOGGING.FLOW);

      return this.$store.getters[`${ inStore }/all`](LOGGING.FLOW);
    },
    loading() {
      return this.rows.length ? false : this.$fetchState.pending;
    },
  },
};
</script>

<template>
  <ResourceTable :schema="schema" :rows="rows" :loading="loading" />
</template>
