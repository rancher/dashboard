<script>
// Added by Verrazzano

import ResourceTable from '@shell/components/ResourceTable';
import { VZ_APPLICATION } from '@pkg/types';

import { allHash } from '@shell/utils/promise';

export default {
  name:       'ListApplicationConfiguration',
  components: { ResourceTable },
  data() {
    return { rows: [] };
  },
  async fetch() {
    const isVerrazzano = this.$store.getters['productId'] === 'verrazzano';
    let requests;

    if (isVerrazzano) {
      requests = { allApplications: this.$store.dispatch('management/findAll', { type: VZ_APPLICATION }) };
    } else {
      requests = { allApplications: this.$store.dispatch('cluster/findAll', { type: VZ_APPLICATION }) };
    }
    const hash = await allHash(requests);

    if (hash.allApplications) {
      if (isVerrazzano) {
        this.rows = hash.allApplications.filter((app) => {
          const isVerrazzanoManaged = app?.metadata?.labels && app?.metadata?.labels['verrazzano-managed'];

          return !isVerrazzanoManaged;
        });
      } else {
        this.rows = hash.allApplications;
      }
    }
  }
};
</script>

<template>
  <ResourceTable
    :schema="$attrs.schema"
    :rows="rows"
    :headers="$attrs.headers"
    :group-by="$attrs.groupBy"
    :sub-rows="true"
    :namespaced="true"
    :is-creatable="true"
    :loading="$fetchState.pending"
  />
</template>

<style scoped>

</style>
