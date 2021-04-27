<script>
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import { REGISTER, _FLAGGED } from '@/config/query-params';
import { allHash } from '@/utils/promise';
import { CAPI, MANAGEMENT } from '@/config/types';

export default {
  components: { ResourceTable, Masthead },

  async fetch() {
    const hash = await allHash({
      mgmtClusters:       this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      mgmtPools:          this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL }),
      mgmtTemplates:      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE }),
      rancherClusters:    this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
      machineDeployments: this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT })
    });

    this.mgmtClusters = hash.mgmtClusters;
    this.rancherClusters = hash.rancherClusters;
  },

  data() {
    return {
      resource:        CAPI.RANCHER_CLUSTER,
      schema:          this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
      mgmtClusters:    [],
      rancherClusters: [],
    };
  },

  computed: {
    rows() {
      return this.rancherClusters;
    },

    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource
        },
      };
    },

    importLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource
        },
        query: { [REGISTER]: _FLAGGED }
      };
    }
  },

  mounted() {
    window.c = this;
  },
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
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

    <ResourceTable :schema="schema" :rows="rows" :namespaced="false">
      <template #cell:provider="{row}">
        <template v-if="row.nodeProviderDisplay">
          {{ row.nodeProviderDisplay }}
          <div class="text-muted">
            {{ row.provisionerDisplay }}
          </div>
        </template>
        <template v-else>
          {{ row.provisionerDisplay }}
        </template>
      </template>
      <template #cell:explorer="{row}">
        <n-link v-if="row.mgmt && row.mgmt.isReady" class="btn btn-sm role-primary" :to="{name: 'c-cluster', params: {cluster: row.mgmt.id}}">
          Explore
        </n-link>
        <button v-else :disabled="true" class="btn btn-sm role-primary">
          Explore
        </button>
      </template>
    </ResourceTable>
  </div>
</template>
