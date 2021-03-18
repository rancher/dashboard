<script>
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import { REGISTER, _FLAGGED } from '@/config/query-params';
import { allHash } from '@/utils/promise';
import { CAPI } from '@/config/types';

export default {
  components: { ResourceTable, Masthead },

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
    const hash = await allHash({
      clusters:           this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
      machineDeployments: this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT })
    });

    this.rows = hash.clusters;
  },

  data() {
    return { rows: [] };
  },

  computed: {
    importLink() {
      return {
        name:  'c-cluster-product-resource-create',
        query: { [REGISTER]: _FLAGGED }
      };
    }
  },
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
    >
      <template slot="extraActions">
        <n-link
          :to="importLink"
          class="btn role-primary"
        >
          {{ t('cluster.import') }}
        </n-link>
      </template>
    </Masthead>

    <ResourceTable :schema="schema" :rows="rows" :namespaced="false" />
  </div>
</template>
