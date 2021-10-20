<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';

export default {
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
    this.rows = await this.$store.dispatch('cluster/findAll', { type: this.resource });
  },

  data() {
    return { rows: null };
  },

  computed: {

    headers() {
      const headersFromSchema = this.$store.getters['type-map/headersFor'](this.schema);

      return headersFromSchema;
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" :headers="headers" />
</template>
