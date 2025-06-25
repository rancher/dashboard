<script>
import { FLEET } from '@shell/config/types';
import { Banner } from '@components/Banner';
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import {
  AGE,
  STATE,
  NAME,
} from '@shell/config/table-headers';
import { isHarvesterCluster } from '@shell/utils/cluster';

export default {
  name:       'ListBundle',
  components: { Banner, ResourceTable },
  mixins:     [ResourceFetch],
  props:      {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    await this.$fetchType(this.resource);
    if (this.$store.getters['management/schemaFor']( FLEET.CLUSTER )) {
      this.allFleet = await this.$store.getters['management/all'](FLEET.CLUSTER);
    }
  },

  data() {
    return { allFleet: [] };
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

      return this.rows.filter((bundle) => {
        const targets = bundle.spec?.targets || [];

        // Filter out any bundle that has one target whose cluster is a harvester cluster
        if (targets.length === 1) {
          return !harvester[targets[0].clusterName];
        }

        return true;
      });
    },

    hidden() {
      return this.rows.length - this.bundles.length;
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

  // override with relevant info for the loading indicator since this doesn't use it's own masthead
  $loadingResources() {
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
  },
};
</script>

<template>
  <div>
    <Banner
      v-if="hidden"
      color="info"
      :label="t('fleet.bundles.harvester', {count: hidden} )"
    />
    <ResourceTable
      :schema="schema"
      :headers="headers"
      :rows="bundles"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    >
      <template #cell:deploymentsReady="{row}">
        <span
          v-if="row.status && row.status.summary && (row.status.summary.desiredReady !== row.status.summary.ready)"
          class="text-warning"
        >
          {{ row.status.summary.ready || 0 }}/{{ row.status.summary.desiredReady }}</span>
        <span v-else-if="row.status && row.status.summary">{{ row.status.summary.desiredReady }}</span>
        <span v-else>-</span>
      </template>
    </ResourceTable>
  </div>
</template>
