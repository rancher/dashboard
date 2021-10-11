<script lang="ts">
import Vue from 'vue';
import EpinioInstance from '@/products/epinio/models/instance.class';
import { EPINIO_TYPES } from '@/products/epinio/types';
import ResourceSummary from '@/components/ResourceSummary.vue';
import Loading from '@/components/Loading.vue';

interface Data {
  cluster: EpinioInstance

}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    ResourceSummary,
    Loading
  },

  async fetch() {
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.INSTANCE });
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.NAMESPACE });
    await this.$store.dispatch('epinio/findAll', { type: EPINIO_TYPES.APP });

    const currentClusterId = this.$store.getters['clusterId'];

    this.cluster = this.$store.getters['epinio/byId'](EPINIO_TYPES.INSTANCE, currentClusterId);
  },

  methods: {
    name(resource: any, counts: number) {
      const inStore = this.$store.getters['currentStore'](resource);
      const schema = this.$store.getters[`${ inStore }/schemaFor`](resource);

      return this.$store.getters['type-map/labelFor'](schema, counts);
    },
  },

  computed: {
    totalResources() {
      return {
        name:         this.t('clusterIndexPage.resourceGauge.totalResources'),
        total:        this.namespacesCount + this.applicationsCount,
        useful:       this.namespacesCount + this.applicationsCount,
        warningCount: 2,
        errorCount:   3
      };
    },
    namespaces() {
      return {
        name:         this.name(EPINIO_TYPES.NAMESPACE, this.namespacesCount),
        total:        this.namespacesCount,
        useful:       this.namespacesCount,
        warningCount: 2,
        errorCount:   3
      };
    },
    namespacesCount() {
      return this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE).length;
    },
    applications() {
      return {
        name:         this.name(EPINIO_TYPES.APP, this.applicationsCount),
        total:        this.applicationsCount,
        useful:       this.applicationsCount,
        warningCount: 2,
        errorCount:   3
      };
    },
    applicationsCount() {
      return this.$store.getters['epinio/all'](EPINIO_TYPES.APP).length;
    },
  }
});
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <section v-else class="dashboard">
    <header>
      <div class="title">
        <h1>
          Dashboard: {{ cluster.name }}
        </h1>
      </div>
    </header>
    <div
      class="cluster-dashboard-glance"
    >
      <div>
        <label>{{ t('glance.version') }}: </label>
        <span>??</span>
      </div>
      <div>
        <label>{{ t('glance.created') }}: </label>
        <span>
          ?? days ago
          <!-- <LiveDate :value="currentCluster.metadata.creationTimestamp" :add-suffix="true" :show-tooltip="true" /> -->
        </span>
      </div>
      <div :style="{'flex':1}" />
    </div>

    <div class="resource-gauges">
      <ResourceSummary :spoofed-counts="totalResources" />
      <ResourceSummary :spoofed-counts="applications" />
      <ResourceSummary :spoofed-counts="namespaces" />
    </div>

    <div class="events">
      List of events, etc
    </div>
  </section>
</template>

<style lang="scss" scoped>
.cluster-dashboard-glance {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 20px 0px;
  display: flex;

  &>*:not(:last-child) {
    margin-right: 40px;

    & SPAN {
       font-weight: bold
    }
  }
}

.events {
  margin-top: 30px;
}

</style>
