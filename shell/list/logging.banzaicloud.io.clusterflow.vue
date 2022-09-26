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
    await this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_OUTPUT });
    await this.$fetchType(this.resource);
  },

  computed: {
    rows() {
      const inStore = this.$store.getters['currentStore'](this.resource);

      return this.$store.getters[`${ inStore }/all`](this.resource);
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
