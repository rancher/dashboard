<script>
import BrandImage from '@shell/components/BrandImage';
import TypeDescription from '@shell/components/TypeDescription';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { NAME as VIRTUAL } from '../config/harvester';
import { CAPI, HCI, VIRTUAL_HARVESTER_PROVIDER, MANAGEMENT } from '@shell/config/types';
import { isHarvesterCluster } from '@shell/utils/cluster';

export default {
  components: {
    BrandImage,
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

    canCreateCluster() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find(x => x.toLowerCase() === 'post');
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

      <template v-if="canCreateCluster" slot="extraActions">
        <n-link
          :to="importLocation"
          class="btn role-primary"
        >
          {{ t('cluster.importAction') }}
        </n-link>
      </template>
    </Masthead>

    <ResourceTable
      v-if="rows && rows.length"
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
                name: `${VIRTUAL}-c-cluster`,
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
    <div v-else>
      <div class="no-clusters">
        {{ t('harvester.manager.cluster.none') }}
      </div>
      <hr class="info-section" />
      <div class="logo">
        <BrandImage file-name="harvester.png" height="64" />
      </div>
      <div class="tagline">
        <div>{{ t('harvester.manager.cluster.description') }}</div>
      </div>
      <div class="tagline sub-tagline">
        <div v-html="t('harvester.manager.cluster.learnMore', {}, true)"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .no-clusters {
    text-align: center;
  }

  .info-section {
    margin-top: 60px;
  }

  .logo {
    display: flex;
    justify-content: center;
    margin: 60px 0 40px 0;
  }

  .tagline {
    display: flex;
    justify-content: center;
    margin-top: 30px;

    > div {
      font-size: 16px;
      line-height: 22px;
      max-width: 80%;
      text-align: center;
    }
  }
</style>
