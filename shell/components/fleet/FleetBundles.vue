<script>
import { FLEET } from '@shell/config/types';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import {
  CREATION_DATE,
  STATE,
  NAME,
  FLEET_BUNDLE_LAST_UPDATED,
} from '@shell/config/table-headers';
import { isHarvesterCluster } from '@shell/utils/cluster';

export default {
  name: 'FleetBundles',

  components: {
    Banner, Loading, ResourceTable
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    this.allFleet = await this.$store.getters['management/all'](FLEET.CLUSTER);
  },

  data() {
    return { allFleet: [] };
  },

  computed: {

    allBundles() {
      // gitrepo model has getter for bundles.
      return this.value.bundles || [];
    },

    schema() {
      return this.$store.getters['management/schemaFor']( FLEET.BUNDLE );
    },

    repoName() {
      return this.value.metadata.name;
    },

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
        const isRepoBundle = bundle.metadata.name.startsWith(`${ this.value.metadata.name }-`);

        if (!isRepoBundle) {
          return false;
        }

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
        FLEET_BUNDLE_LAST_UPDATED,
        CREATION_DATE,
      ];

      return out;
    },
  },

  methods: {
    displayWarning(row) {
      return !!row.status?.summary && (row.status.summary.desiredReady !== row.status.summary.ready);
    }
  }
};
</script>
<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <div v-else>
      <Banner
        v-if="hidden"
        color="info"
        :label="t('fleet.bundles.harvester', {count: hidden} )"
      />
      <ResourceTable
        :schema="schema"
        :headers="headers"
        :rows="bundles"
      >
        <template #cell:deploymentsReady="{row}">
          <span
            v-if="displayWarning(row)"
            class="text-warning"
          >
            {{ row.status.summary.ready }}/{{ row.status.summary.desiredReady }}</span>
          <span v-else-if="row.status">{{ row.status.summary.desiredReady }}</span>
        </template>
      </ResourceTable>
    </div>
  </div>
</template>
