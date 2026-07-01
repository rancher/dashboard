<script>
import { FLEET, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { CAPI } from '@shell/config/labels-annotations';
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
    },

    /**
     * When provided (detail usage), use these clusters for the Harvester filter instead of
     * fetching every cluster - the owning page already fetched just the relevant clusters.
     */
    clusters: {
      type:    Array,
      default: null,
    }
  },

  async fetch() {
    let hash;

    try {
      const toFetch = {};

      // Only fetch bundles if in list mode (the list's own resource)
      if (this.isListMode) {
        toFetch.bundle = {
          inStoreType: 'management',
          type:        this.resource
        };
      }

      if (Object.keys(toFetch).length) {
        hash = await checkSchemasForFindAllHash(toFetch, this.$store);
      }
    } catch (e) {
    }

    // checkSchemasForFindAllHash already fetched the data, just get it from the store
    if (this.isListMode && hash?.bundle) {
      // Data is already in the store, no need to fetch again
      this.rows = hash.bundle;
    }

    // Clusters are only needed to hide single-target Harvester bundles. Skip entirely when the
    // parent already provided clusters or when Harvester hosts are visible; otherwise fetch ONLY the
    // Harvester clusters (server-side, by provider label) rather than every cluster.
    if (!this.clusters && !this.$store.getters['features/get'](HARVESTER_CONTAINER) && this.$store.getters['management/schemaFor'](FLEET.CLUSTER)) {
      try {
        this.allFleet = await this.$store.dispatch('management/findLabelSelector', {
          type:     FLEET.CLUSTER,
          matching: { labelSelector: { matchLabels: { [CAPI.PROVIDER]: VIRTUAL_HARVESTER_PROVIDER } } },
        }) || [];
      } catch (e) {
        this.allFleet = [];
      }
    }
  },

  data() {
    return {
      allFleet: [],
      rows:     []
    };
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

      (this.clusters || this.allFleet).forEach((c) => {
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
