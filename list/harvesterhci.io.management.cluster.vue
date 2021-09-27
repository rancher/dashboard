<script>
import TypeDescription from '@/components/TypeDescription';
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import { NAME as VIRTUAL } from '@/config/product/harvester';
import { CAPI, HCI, VIRTUAL_HARVESTER_PROVIDER, MANAGEMENT } from '@/config/types';
import { isHarvesterCluster } from '@/utils/cluster';

export default {
  components: {
    ResourceTable,
    Masthead,
    TypeDescription
  },

  props:      {
    schema: {
      type:     Object,
      required: true,
    },
  },

  data() {
    const resource = CAPI.RANCHER_CLUSTER;

    return {
      VIRTUAL,
      resource,
      hResource:  HCI.CLUSTER,
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

    rows() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const clusters = this.$store.getters[`${ inStore }/all`](HCI.CLUSTER);
      const manageClusters = this.$store.getters[`${ inStore }/all`](MANAGEMENT.CLUSTER);

      return clusters.filter((c) => {
        const cluster = manageClusters.find(cluster => cluster?.metadata?.name === c?.status?.clusterName);

        if (cluster?.status?.provider && cluster?.status?.provider !== VIRTUAL_HARVESTER_PROVIDER) {
          return false;
        }

        return isHarvesterCluster(cluster);
      });
    },

    typeDisplay() {
      return this.t(`typeLabel."${ HCI.CLUSTER }"`, { count: this.row?.length || 0 });
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
      :type-display="typeDisplay"
    >
      <template #typeDescription>
        <TypeDescription :resource="hResource" />
      </template>

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
      <template #col:name="{row}">
        <td>
          <span>
            <n-link
              v-if="row.isReady"
              :to="{
                name: `c-cluster-${VIRTUAL}`,
                params: {
                  cluster: row.status.clusterName,
                }
              }"
            >
              {{ row.nameDisplay }}
            </n-link>
            <span v-else>
              {{ row.nameDisplay }}
            </span>
          </span>
        </td>
      </template>

      <template #cell:harvester="{row}">
        <n-link
          class="btn btn-sm role-primary"
          :to="row.detailLocation"
        >
          {{ t('harvester.virtualizationManagement.manage') }}
        </n-link>
      </template>
    </ResourceTable>
  </div>
</template>
