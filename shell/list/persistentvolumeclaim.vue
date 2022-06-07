<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STORAGE_CLASS } from '@shell/config/types';

export default {
  name:       'ListPersistentVolumeClaim',
  components: { ResourceTable },

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
    const inStore = this.$store.getters['currentStore']();

    // Fetch storage classes so we can determine if a PVC can be expanded
    this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS });

    this.rows = await this.$store.dispatch(`${ inStore }/findAll`, { type: this.resource });
  },

  data() {
    return { rows: [] };
  }
};
</script>

<template>
  <ResourceTable
    :loading="$fetchState.pending"
    :schema="schema"
    :rows="rows"
  />
</template>
