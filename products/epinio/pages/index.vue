<script lang="ts">
import Vue from 'vue';

import Loading from '@/components/Loading.vue';
import ResourceTable from '@/components/ResourceTable.vue';
import { EPINIO_MGMT_STORE, EPINIO_TYPES } from '@/products/epinio/types';
import EpinioInstance from '@/products/epinio/models/instance.class';

interface Data {
  clusters: EpinioInstance[],
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: { Loading, ResourceTable },

  layout: 'plain',

  async fetch() {
    this.clusters = await this.$store.dispatch(`${ EPINIO_MGMT_STORE }/findAll`, { type: EPINIO_TYPES.INSTANCE });

    if (this.clusters.length === 1 ) {
      // TODO: RC
      // this.$router.replace({
      //   name:   createEpinioRoute(`c-cluster`),
      //   params: { cluster: this.clusters[0].id }
      // });
    }
  },

  data() {
    return {
      clusters:       [],
      clustersSchema: this.$store.getters[`${ EPINIO_MGMT_STORE }/schemaFor`](EPINIO_TYPES.INSTANCE)
    };
  },

  computed: {
    cluster(): string {
      return this.$route.params.cluster;
    },

    product(): string {
      return this.$route.params.product;
    }
  },

});
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="main" />
  <div v-else-if="clusters.length === 0" class="root">
    <h2>{{ t('epinio.instances.none.header') }}</h2>
    <p>{{ t('epinio.instances.none.description') }}</p>
  </div>
  <div v-else class="root">
    <div class="epinios-table">
      <h2>{{ t('epinio.instances.header') }}</h2>

      <ResourceTable
        :rows="clusters"
        :schema="clustersSchema"
        :table-actions="false"
      >
        <template #cell:pick="{row}">
          <n-link class="btn btn-sm role-primary" :to="{name: 'ext-epinio-c-cluster-applications', params: {cluster: row.id}}">
            {{ t('landing.clusters.explore') }}
          </n-link>
        </template>
      </ResourceTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>

div.root {
  align-items: center;
  padding-top: 50px;
  display: flex;

  .epinios-table {
    & > h4 {
      padding-top: 50px;
      padding-bottom : 20px;
    }
    min-width: 60%;
  }
}

</style>
