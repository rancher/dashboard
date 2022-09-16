<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { PVC } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListPersistentVolume',
  components: { Loading, ResourceTable },
  mixins:     [ResourceFetch],
  async fetch() {
    const inStore = this.$store.getters['currentStore']();
    const pvcPromise = this.$store.dispatch(`${ inStore }/findAll`, { type: PVC });

    this.rows = await this.$fetchType(this.$attrs.resource);
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
