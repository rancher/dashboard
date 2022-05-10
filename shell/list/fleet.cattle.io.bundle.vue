<script>
import { FLEET } from '@shell/config/types';
import Banner from '@shell/components/Banner';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import {
  AGE,
  STATE,
  NAME,
} from '@shell/config/table-headers';
import { isHarvesterCluster } from '@shell/utils/cluster';

export default {
  name:       'ListBundle',
  components: {
    Banner, Loading, ResourceTable
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.allBundles = await this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE });
    this.allFleet = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
  },

  data() {
    return {
      allFleet:   [],
      allBundles: [],
    };
  },

  computed: {
    harvesterClusters() {
      const harvester = {};

      this.allFleet.forEach((c) => {
        if (isHarvesterCluster(c)) {
          harvester[c.metadata.name] = c;
        }
      });

      return harvester;
    },

    bundles() {
      const harvester = this.harvesterClusters;

      return this.allBundles.filter((bundle) => {
        const targets = bundle.spec?.targets || [];

        // Filter out any bundle that has one target whose cluster is a harvester cluster
        if (targets.length === 1) {
          return !harvester[targets[0].clusterName];
        }

        return true;
      });
    },

    hidden() {
      return this.allBundles.length - this.bundles.length;
    },

    headers() {
      const out = [
        STATE,
        NAME,
        {
          name:     'deploymentsReady',
          labelKey: 'tableHeaders.bundleDeploymentsReady',
          value:    'status.display.readyClusters',
          sort:     'status.display.readyClusters',
          search:   ['status.summary.ready', 'status.summary.desiredReady'],
        },
        AGE
      ];

      return out;
    },
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <div v-else>
      <Banner v-if="hidden" color="info" :label="t('fleet.bundles.harvester', {count: hidden} )" />
      <ResourceTable
        :schema="schema"
        :headers="headers"
        :rows="bundles"
      >
        <template #cell:deploymentsReady="{row}">
          <span v-if="row.status.summary.desiredReady != row.status.summary.ready" class="text-warning">
            {{ row.status.summary.ready }}/{{ row.status.summary.desiredReady }}</span>
          <span v-else>{{ row.status.summary.desiredReady }}</span>
        </template>
      </ResourceTable>
    </div>
  </div>
</template>
