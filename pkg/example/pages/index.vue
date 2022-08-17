<script lang="ts">
import Vue from 'vue';

import Loading from '@shell/components/Loading.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { EXAMPLE_MGMT_STORE, EXAMPLE_TYPES } from '../types';

// TODO: RC lint
interface Data {
  clustersSchema: any;
  exampleResource: string;
  clusterResource: string;
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: { Loading, ResourceTable },

  layout: 'plain',

  async fetch() {
    // Note - In production systems this isn't needed, but because we mock data ensure we have a list to avoid fetching and wiping out changes
    await this.$store.dispatch(`${ EXAMPLE_MGMT_STORE }/findAll`, { type: EXAMPLE_TYPES.CLUSTER });
  },

  data() {
    return {
      clustersSchema:  this.$store.getters[`${ EXAMPLE_MGMT_STORE }/schemaFor`](EXAMPLE_TYPES.CLUSTER),
      exampleResource: EXAMPLE_TYPES.RESOURCE,
      clusterResource: EXAMPLE_TYPES.CLUSTER,
    };
  },

  computed: {
    clusters() {
      return this.$store.getters[`${ EXAMPLE_MGMT_STORE }/all`](EXAMPLE_TYPES.CLUSTER);
    },
  },

});
</script>

<template>
  <Loading v-if="$fetchState.pending" mode="main" />
  <div v-else class="root">
    <div class="example-table">
      <h2>{{ t(`typeLabel."${ clusterResource }"`, { count: 2 }) }}</h2>
      <ResourceTable
        :rows="clusters"
        :schema="clustersSchema"
        :table-actions="false"
        :row-actions="false"
      >
        <template #cell:name="{row}">
          <n-link v-if="row.metadata.state.name === 'active'" :to="{name: 'example-c-cluster-resource', params: {cluster: row.id, resource: exampleResource}}">
            {{ row.name }}
          </n-link>
          <template v-else>
            {{ row.name }}
          </template>
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

  .example-table {
    & > h4 {
      padding-top: 50px;
      padding-bottom : 20px;
    }
    min-width: 60%;
  }
}

</style>
