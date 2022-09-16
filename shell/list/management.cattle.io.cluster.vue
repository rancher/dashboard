<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { MANAGEMENT } from '@shell/config/types';
import { filterOnlyKubernetesClusters } from '@shell/utils/cluster';
import ResourceFetch from '@shell/mixins/resource-fetch';
export default {
  name:       'ListMgmtClusters',
  components: { Loading, ResourceTable },
  mixins:     [ResourceFetch],
  async fetch() {
    await this.$fetchType(this.$attrs.resource);
  },

  computed: {
    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },
    rows() {
      const all = this.$store.getters[`${ this.inStore }/all`](MANAGEMENT.CLUSTER);

      return filterOnlyKubernetesClusters(all);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="$attrs.schema" :rows="rows" :headers="$attrs.headers" :group-by="$attrs.groupBy" />
</template>
