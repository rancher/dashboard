<script lang="ts">
import Vue from 'vue';

import Loading from '@/components/Loading.vue';
import ResourceTable from '@/components/ResourceTable.vue';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/plugins/app-extension/epinio/types';

export default Vue.extend({
  components: { Loading, ResourceTable },

  layout: 'plain',

  async fetch() {
    this.clusters = await this.$store.dispatch(`${ EPINIO_PRODUCT_NAME }/findAll`, { type: EPINIO_TYPES.INSTANCE });
  },

  data() {
    return {
      clusters:       [],
      clustersSchema: this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.INSTANCE)
    };
  },

  computed: {
    cluster(): string {
      return this.$route.params.cluster;
    },

    product(): string {
      return this.$route.params.product;
    }
  }
});
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="select-epinio">
    <div class="epinios-table">
      <h4>Select/Setup your Epinio instance</h4>

      <ResourceTable
        :rows="clusters"
        :schema="clustersSchema"
      >
        <template #cell:pick="{row}">
          <n-link class="btn btn-sm role-primary" :to="{name: 'ext-epinio-c-cluster', params: {cluster: row.id}}">
            {{ t('landing.clusters.explore') }}
          </n-link>
        </template>
      </ResourceTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.select-epinio {

    display: flex;
    align-items: center;

  .epinios-table {
    & > h4 {
      padding-top: 50px;
      padding-bottom : 20px;
    }
    min-width: 60%;
  }
}

</style>
