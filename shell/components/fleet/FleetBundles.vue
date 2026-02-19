<script>
import { FLEET } from '@shell/config/types';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import {
  AGE,
  CREATION_DATE,
  STATE,
  NAME,
  FLEET_BUNDLE_LAST_UPDATED,
} from '@shell/config/table-headers';
import { isHarvesterCluster } from '@shell/utils/cluster';
import { HARVESTER_CONTAINER } from '@shell/store/features';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';

export default {
  name: 'FleetBundles',

  components: {
    Banner, Loading, ResourceTable
  },

  mixins: [ResourceFetch],

  props: {
    value: {
      type:     Object,
      required: false,
      default:  null,
    },

    resource: {
      type:     String,
      required: false,
      default:  null,
    },

    schema: {
      type:     Object,
      required: false,
      default:  null,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    try {
      await checkSchemasForFindAllHash({
        cluster: {
          inStoreType: 'management',
          type:        FLEET.CLUSTER
        },
      }, this.$store);
    } catch (e) {
    }

    // Only fetch all bundles if we're in list mode (no value prop)
    if (!this.value && this.resource) {
      await this.$fetchType(this.resource);
    }

    if (this.$store.getters['management/schemaFor']( FLEET.CLUSTER )) {
      this.allFleet = await this.$store.getters['management/all'](FLEET.CLUSTER);
    }
  },

  data() {
    return { allFleet: [] };
  },

  mounted() {
    this.areHarvesterHostsVisible = this.$store.getters['features/get'](HARVESTER_CONTAINER);
  },

  computed: {
    isListMode() {
      return !this.value;
    },

    allBundlesInRepo() {
      // If in list mode, return all rows from ResourceFetch mixin
      if (this.isListMode) {
        return this.rows;
      }

      // Otherwise, get bundles from the gitrepo
      return this.value.bundles || [];
    },

    bundleSchema() {
      return this.schema || this.$store.getters['management/schemaFor']( FLEET.BUNDLE );
    },

    repoName() {
      return this.value?.metadata?.name;
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

      if (this.areHarvesterHostsVisible) {
        return this.allBundlesInRepo;
      }

      return this.allBundlesInRepo.filter((bundle) => {
        const targets = bundle.spec?.targets || [];

        // Filter out any bundle that has one target whose cluster is a harvester cluster
        if (targets.length === 1) {
          return !harvester[targets[0].clusterName];
        }

        return true;
      });
    },

    hidden() {
      return this.allBundlesInRepo.length - this.bundles.length;
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
      ];

      // In list mode, show AGE. In component mode, show last updated and creation date
      if (this.isListMode) {
        out.push(AGE);
      } else {
        out.push(FLEET_BUNDLE_LAST_UPDATED);
        out.push(CREATION_DATE);
      }

      return out;
    },
  },
  methods: {
    displayWarning(row) {
      return !!row.status?.summary && (row.status.summary.desiredReady !== row.status.summary.ready);
    }
  },

  // override with relevant info for the loading indicator since this doesn't use it's own masthead
  $loadingResources() {
    if (this.isListMode) {
      // results are filtered so we wouldn't get the correct count on indicator...
      return { loadIndeterminate: true };
    }

    return undefined;
  },
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
        :schema="bundleSchema"
        :headers="headers"
        :rows="bundles"
        :loading="loading"
        :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
        :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      >
        <template #cell:deploymentsReady="{row}">
          <span
            v-if="displayWarning(row)"
            class="text-warning"
          >
            {{ row.status.summary.ready || 0 }}/{{ row.status.summary.desiredReady }}</span>
          <span v-else-if="row.status && row.status.summary">{{ row.status.summary.desiredReady }}</span>
          <span v-else>-</span>
        </template>
      </ResourceTable>
    </div>
  </div>
</template>
