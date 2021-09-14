<script>
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import { allHash } from '@/utils/promise';
import { CAPI, MANAGEMENT } from '@/config/types';
import { MODE, _IMPORT } from '@/config/query-params';

export default {
  components: { ResourceTable, Masthead },

  async fetch() {
    const hash = {
      mgmtClusters:       this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      rancherClusters:    this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
    };

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
      hash.mgmtNodes = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
      hash.mgmtPools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
      hash.mgmtTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT) ) {
      hash.machineDeployments = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT });
    }

    const res = await allHash(hash);

    this.mgmtClusters = res.mgmtClusters;
    this.rancherClusters = res.rancherClusters;
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
        query: { [MODE]: _IMPORT }
      };
    },

    canImport() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find(x => x.toLowerCase() === 'post');
    },
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
      <template v-if="canImport" slot="extraActions">
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
        <template v-if="row.machineProvider">
          {{ row.machineProviderDisplay }}
          <div class="text-muted">
            {{ row.provisionerDisplay }}
          </div>
        </template>
        <template v-else>
          {{ row.provisionerDisplay }}
        </template>
      </template>
      <template #cell:summary="{row}">
        <span v-if="!row.stateParts.length">{{ row.nodes.length }}</span>
      </template>
      <template #cell:explorer="{row}">
        <n-link v-if="row.mgmt && row.mgmt.isReady" class="btn role-primary" :to="{name: 'c-cluster', params: {cluster: row.mgmt.id}}">
          Explore
        </n-link>
        <button v-else :disabled="true" class="btn role-primary">
          Explore
        </button>
      </template>
    </ResourceTable>
  </div>
</template>
