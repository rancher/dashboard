<script>
import ResourceTable from '@shell/components/ResourceTable';
import { PVC } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListPersistentVolume',
  components: { ResourceTable },
  mixins:     [ResourceFetch],
  async fetch() {
    const inStore = this.$store.getters['currentStore']();
    const pvcPromise = this.$store.dispatch(`${ inStore }/findAll`, { type: PVC });

    await this.$fetchType(this.$attrs.resource);
    await pvcPromise;
  },

  computed: {
    rows() {
      const inStore = this.$store.getters['currentStore'](this.$attrs.resource);

      return this.$store.getters[`${ inStore }/all`](this.$attrs.resource);
    },
    loading() {
      return this.rows.length ? false : this.$fetchState.pending;
    },
  },
};
</script>

<template>
  <ResourceTable :schema="$attrs.schema" :rows="rows" :headers="$attrs.headers" :group-by="$attrs.groupBy" :loading="loading" />
</template>
