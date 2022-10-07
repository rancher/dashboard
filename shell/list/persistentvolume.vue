<script>
import ResourceTable from '@shell/components/ResourceTable';
import { PVC } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListPersistentVolume',
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
    const inStore = this.$store.getters['currentStore']();
    const pvcPromise = this.$store.dispatch(`${ inStore }/findAll`, { type: PVC });

    await this.$fetchType(this.resource);
    await pvcPromise;
  }
};
</script>

<template>
  <ResourceTable :schema="schema" :rows="rows" :headers="$attrs.headers" :group-by="$attrs.groupBy" :loading="loading" />
</template>
