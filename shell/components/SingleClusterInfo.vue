<script>
import ClusterProviderIcon from '@shell/components/ClusterProviderIcon';
import ResourceSummary, { resourceCounts } from '@shell/components/ResourceSummary';
import {
  NAMESPACE, MANAGEMENT, NODE, COUNT, CATALOG
} from '@shell/config/types';
import { RESOURCES } from '@shell/pages/c/_cluster/explorer/index';

export default {
  components: {
    ClusterProviderIcon,
    ResourceSummary
  },

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', {
      type: MANAGEMENT.CLUSTER,
      opt:  { url: MANAGEMENT.CLUSTER }
    });
  },

  data() {
    return {
      clusters:      [],
      clusterDetail: null,
      clusterCounts: {}
    };
  },

  computed: {
    exploreLink() {
      return { name: 'c-cluster', params: { cluster: this.clusterDetail.id } };
    },

    clusterToolsLink() {
      return { name: 'c-cluster-explorer-tools', params: { cluster: this.clusterDetail.id } };
    },

    accessibleResources() {
      return RESOURCES.filter(resource => this.$store.getters['cluster/schemaFor'](resource));
    },

    totalCountGaugeInput() {
      const totalInput = {
        name:            this.t('clusterIndexPage.resourceGauge.totalResources'),
        total:           0,
        useful:          0,
        warningCount:    0,
        errorCount:      0
      };

      this.accessibleResources.forEach((resource) => {
        const counts = resourceCounts(this.$store, resource);

        Object.entries(counts).forEach((entry) => {
          totalInput[entry[0]] += entry[1];
        });
      });

      return totalInput;
    },

    canAccessNodes() {
      return !!this.clusterCounts?.[0]?.counts?.[NODE];
    },

    canAccessNamespaces() {
      return !!this.clusterCounts?.[0]?.counts?.[NAMESPACE];
    },

    showClusterTools() {
      return this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO) &&
             this.$store.getters['cluster/canList'](CATALOG.APP);
    }
  },

  watch: {
    async clusters(neu) {
      this.clusterDetail = neu[0];
      await this.$store.dispatch('loadCluster', this.clusterDetail.id);
      this.clusterCounts = this.$store.getters[`cluster/all`](COUNT);
    }
  }
};
</script>

<template>
  <div v-if="clusterDetail">
    <div class="single-cluster-header">
      <ClusterProviderIcon class="rancher-icon" width="32" />
      <h1>{{ t('glance.clusterInfo') }}</h1>
    </div>

    <div class="single-cluster-info">
      <div class="cluster-counts">
        <ResourceSummary :spoofed-counts="totalCountGaugeInput" />
        <ResourceSummary v-if="canAccessNodes" :cluster="clusterDetail.id" resource="node" />
        <ResourceSummary v-if="canAccessNamespaces" :cluster="clusterDetail.id" resource="namespace" />
      </div>
      <div class="glance-item">
        <label>{{ t('glance.provider') }}: </label>
        <span>{{ t(`cluster.provider.${ clusterDetail.status.provider || 'other' }`) }}</span>
      </div>
      <div v-if="clusterDetail.kubernetesVersionRaw" class="glance-item">
        <label>{{ t('glance.version') }}: </label>
        <span v-if="clusterDetail.kubernetesVersionExtension" style="font-size: 0.5em">{{ clusterDetail.kubernetesVersionExtension }}</span>
        <span>{{ clusterDetail.kubernetesVersionBase }}</span>
      </div>
      <div class="glance-item">
        <label>{{ t('glance.created') }}: </label>
        <span><LiveDate :value="clusterDetail.metadata.creationTimestamp" :add-suffix="true" :show-tooltip="true" /></span>
      </div>
      <div class="section">
        {{ t('generic.links') }}
      </div>
      <div class="glance-item">
        <nuxt-link :to="exploreLink" class="cluster-link">
          {{ t('nav.categories.explore') }}
        </nuxt-link>
      </div>
      <div v-if="showClusterTools" class="glance-item">
        <nuxt-link :to="clusterToolsLink" class="cluster-link">
          {{ t('nav.clusterTools') }}
        </nuxt-link>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .single-cluster-header {
    align-items: center;
    display: flex;

    .rancher-icon {
      margin-right: 10px;
    }

    h1 {
      font-size: 20px;
      margin: 0;
    }
  }
  .single-cluster-info {
    margin-top: 20px;

    .section {
      margin: 15px 0 5px 0;
      font-weight: bold;
    }

    .cluster-counts {
      display: flex;
      margin: 10px 0;
      > * {
        flex: 1;
        &:not(:last-child) {
          margin-right: 20px;
        }
      }
    }

    .glance-item {
      font-size: 14px;
      padding: 5px 0;

      .cluster-link {
        font-size: 14px;
      }
    }
  }
</style>
