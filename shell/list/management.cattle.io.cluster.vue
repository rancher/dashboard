<script>
import ResourceTable from '@shell/components/ResourceTable';
import { MANAGEMENT } from '@shell/config/types';
import { filterOnlyKubernetesClusters } from '@shell/utils/cluster';
import ResourceFetch from '@shell/mixins/resource-fetch';
export default {
  name:       'ListMgmtClusters',
  components: { ResourceTable },
  mixins:     [ResourceFetch],
  async fetch() {
    await this.$fetchType(this.$attrs.resource);
  },
  computed: {
    loading() {
      return this.rows?.length ? false : this.$fetchState.pending;
    },
    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },
    rows() {
      const all = this.$store.getters[`${ this.inStore }/all`](MANAGEMENT.CLUSTER);

      return filterOnlyKubernetesClusters(all);
    }
  },
  // override with relevant info for the loading indicator since this doesn't use it's own masthead
  $loadingResources() {
    return {
      loadResources:     [MANAGEMENT.CLUSTER],
      loadIndeterminate: true, // results are filtered so we wouldn't get the correct count on indicator...
    };
  },
};
</script>

<template>
  <ResourceTable :schema="$attrs.schema" :rows="rows" :headers="$attrs.headers" :group-by="$attrs.groupBy" :loading="loading" />
</template>
