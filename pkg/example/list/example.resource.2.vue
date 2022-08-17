<script>
import ResourceTable from '@shell/components/ResourceTable';
import { EXAMPLE_STORE, EXAMPLE_TYPES } from '../types';

export default {
  components: { ResourceTable },
  async fetch() {
    await this.$store.dispatch(`${ EXAMPLE_STORE }/findAll`, { type: EXAMPLE_TYPES.RESOURCE_2 });
  },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    rows() {
      return this.$store.getters[`${ EXAMPLE_STORE }/all`](EXAMPLE_TYPES.RESOURCE_2);
    },
  }
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :rows="rows"
    :schema="schema"
    :loading="$fetchState.pending"
    :table-actions="false"
    :row-actions="false"
    v-on="$listeners"
  >
  </ResourceTable>
</template>
