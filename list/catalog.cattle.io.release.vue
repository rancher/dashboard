<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';

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
    await this.$store.dispatch('catalog/load');

    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" />
</template>
