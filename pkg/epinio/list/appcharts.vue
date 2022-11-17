<script>
import ResourceTable from '@shell/components/ResourceTable';
import { EPINIO_TYPES } from '../types';

export default {
  name:       'EpinioAppChartsList',
  components: { ResourceTable },
  async fetch() {
    await this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.APP_CHARTS });
  },
  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    rows() {
      return this.$store.getters['epinio/all'](EPINIO_TYPES.APP_CHARTS);
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
    v-on="$listeners"
  />
</template>
