<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { PVC } from '@/config/types';

export default {
  name:       'ListPersistentVolume',
  components: { Loading, ResourceTable },

  async fetch() {
    const inStore = this.$store.getters['currentStore']();
    const pvcPromise = this.$store.dispatch(`${ inStore }/findAll`, { type: PVC });

    this.rows = await this.$store.dispatch(`${ inStore }/findAll`, { type: this.$attrs.resource });
    await pvcPromise;
  },

  data() {
    return { rows: [] };
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="$attrs.schema" :rows="rows" :headers="$attrs.headers" :group-by="$attrs.groupBy" />
</template>
