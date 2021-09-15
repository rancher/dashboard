<script>
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import { NAME as VIRTUAL } from '@/config/product/harvester';
import { CAPI } from '@/config/types';

export default {

  components: { ResourceTable, Masthead },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },

  data() {
    const resource = CAPI.RANCHER_CLUSTER;

    return {
      VIRTUAL,
      resource,
      realSchema: this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
    };
  },

  computed: {
    importLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.schema.id,
        },
      };
    },
  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="realSchema"
      :resource="resource"
      :is-creatable="false"
    >
      <template slot="extraActions">
        <n-link
          :to="importLocation"
          class="btn role-primary"
        >
          {{ t('cluster.importAction') }}
        </n-link>
      </template>
    </Masthead>

    <ResourceTable
      :schema="schema"
      :rows="rows"
      :sub-rows="true"
      :is-creatable="true"
      :namespaced="false"
    >
      <template #cell:harvester="{row}">
        <n-link
          v-if="row.isReady"
          class="btn btn-sm role-primary"
          :to="{
            name: `c-cluster-${VIRTUAL}`,
            params: {
              cluster: row.status.clusterName,
            }
          }"
        >
          Harvester
        </n-link>
        <button
          v-else
          :disabled="true"
          class="btn btn-sm role-primary"
        >
          Harvester
        </button>
      </template>
    </ResourceTable>
  </div>
</template>
