<script>
// Added by Verrazzano
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { VZ_APPLICATION } from '~/pkg/verrazzano/types';

import { allHash } from '@shell/utils/promise';

export default {
  name:       'ApplicationsResourceList',
  components: {
    ResourceTable,
    Masthead,
  },
  computed: {
    resource() {
      return VZ_APPLICATION;
    },
    schema() {
      return this.$store.getters['cluster/schemaFor'](VZ_APPLICATION);
    },
  },
  data() {
    return { fetchInProgress: true, rows: null };
  },

  async fetch() {
    const hash = { allApplications: this.$store.dispatch('management/findAll', { type: VZ_APPLICATION }) };

    const res = await allHash(hash);

    if (res.allApplications) {
      const productId = this.$store.getters['productId'];

      if (productId === 'verrazzano') {
        this.rows = res.allApplications.filter((app) => {
          const isVerrazzanoManaged = app?.metadata?.labels && app?.metadata?.labels['verrazzano-managed'];

          return !isVerrazzanoManaged;
        });
      } else {
        this.rows = res.allApplications;
      }
    }

    this.fetchInProgress = false;
  },
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
    />

    <ResourceTable
      v-if="rows && rows.length"
      :schema="schema"
      :rows="rows"
      :sub-rows="true"
      :is-creatable="true"
      :namespaced="true"
      :loading="fetchInProgress"
    />
  </div>
</template>
