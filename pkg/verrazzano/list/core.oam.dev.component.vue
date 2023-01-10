<script>
// Added by Verrazzano

import ResourceTable from '@shell/components/ResourceTable';
import { VZ_COMPONENT } from '@pkg/types';

import { allHash } from '@shell/utils/promise';

export default {
  name:       'ListComponent',
  components: { ResourceTable },
  data() {
    return { rows: [] };
  },
  async fetch() {
    const isVerrazzano = this.$store.getters['productId'] === 'verrazzano';
    let requests;

    if (isVerrazzano) {
      requests = { allComponents: this.$store.dispatch('management/findAll', { type: VZ_COMPONENT }) };
    } else {
      requests = { allComponents: this.$store.dispatch('cluster/findAll', { type: VZ_COMPONENT }) };
    }
    const hash = await allHash(requests);

    if (hash.allComponents) {
      if (isVerrazzano) {
        this.rows = hash.allComponents.filter((app) => {
          const isVerrazzanoManaged = app?.metadata?.labels && app?.metadata?.labels['verrazzano-managed'];

          return !isVerrazzanoManaged;
        });
      } else {
        this.rows = hash.allComponents;
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
