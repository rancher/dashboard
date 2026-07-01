<script>
import FleetClusters from '@shell/components/fleet/FleetClusters';
import { FLEET, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import { CAPI } from '@shell/config/labels-annotations';
import { filterOnlyKubernetesClusters } from '@shell/utils/cluster';
import { HARVESTER_CONTAINER } from '@shell/store/features';
import { Banner } from '@components/Banner';
import ResourceFetch from '@shell/mixins/resource-fetch';
import FleetListPagination from '@shell/mixins/fleet-list-pagination';
import {
  PaginationArgs,
  PaginationParamFilter,
  PaginationParamProjectOrNamespace,
  PaginationFilterEquality,
} from '@shell/types/store/pagination.types';

export default {
  name:       'ListCluster',
  components: { Banner, FleetClusters },
  mixins:     [ResourceFetch, FleetListPagination],
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
    this.$initializeFetchData(this.resource);

    await this.$fetchType(this.resource);
  },

  data() {
    return { harvesterCount: 0 };
  },

  computed: {
    areHarvesterHostsVisible() {
      return this.$store.getters['features/get'](HARVESTER_CONTAINER);
    },

    fleetClusters() {
      // Under server-side pagination the rows are already FLEET.CLUSTER; filter defensively for the
      // non-paginated path too. (The previous management-cluster merge was a no-op - those rows
      // were appended then removed again by this type filter.)
      return this.rows.filter((c) => c.type === FLEET.CLUSTER);
    },

    // Harvester clusters are hidden unless the harvester feature is enabled. Under pagination this
    // is done server-side (see applyHarvesterFilter) so the page/counts stay correct; the
    // non-paginated fallback filters the rows client-side.
    filteredRows() {
      return this.canPaginate ? this.fleetClusters : filterOnlyKubernetesClusters(this.fleetClusters, this.$store);
    },

    hiddenHarvesterCount() {
      // Under pagination the page is filtered server-side, so use the dedicated count query result;
      // otherwise count what was filtered out of the local page.
      return this.canPaginate ? this.harvesterCount : this.fleetClusters.length - this.filteredRows.length;
    },
  },

  watch: {
    canPaginate: {
      immediate: true,
      handler() {
        this.applyHarvesterFilter();
        this.fetchHarvesterCount();
      }
    },
    areHarvesterHostsVisible() {
      this.applyHarvesterFilter();
      this.fetchHarvesterCount();
    },
    fleetWorkspace() {
      this.fetchHarvesterCount();
    },
  },

  methods: {
    /**
     * Exclude Harvester clusters from the paginated request (rather than filtering them out of the
     * page client-side, which would leave the page short and the totals wrong). Mirrors Fleet's own
     * "exclude harvester" rule - provider.cattle.io NOT IN (harvester).
     */
    applyHarvesterFilter() {
      if (this.canPaginate && !this.areHarvesterHostsVisible) {
        this.requestFilters.filters = [this.harvesterFilterField(PaginationFilterEquality.NOT_IN)];
      } else {
        this.requestFilters.filters = [];
      }
    },

    harvesterFilterField(equality) {
      return PaginationParamFilter.createSingleField({
        field: `metadata.labels[${ CAPI.PROVIDER }]`,
        value: VIRTUAL_HARVESTER_PROVIDER,
        equality,
      });
    },

    /**
     * The Harvester clusters are excluded server-side, so to drive the "hidden" banner we ask the
     * server how many there are (in the current workspace) with a minimal count-only query.
     */
    async fetchHarvesterCount() {
      if (!this.canPaginate || this.areHarvesterHostsVisible) {
        this.harvesterCount = 0;

        return;
      }

      const workspace = this.$store.getters.workspace;

      try {
        const res = await this.$store.dispatch('management/findPage', {
          type: FLEET.CLUSTER,
          opt:  {
            transient:  true,
            pagination: new PaginationArgs({
              page:                 1,
              pageSize:             1,
              projectsOrNamespaces: workspace ? [new PaginationParamProjectOrNamespace({ projectOrNamespace: [workspace] })] : [],
              filters:              [this.harvesterFilterField(PaginationFilterEquality.IN)],
            }),
          },
        });

        this.harvesterCount = res?.pagination?.result?.count || 0;
      } catch (e) {
        this.harvesterCount = 0;
      }
    },
  },

  // override with relevant info for the loading indicator since this doesn't use it's own masthead
  $loadingResources() {
    return {
      loadResources:     [FLEET.CLUSTER],
      loadIndeterminate: true, // results are filtered so we wouldn't get the correct count on indicator...
    };
  },
};
</script>

<template>
  <div>
    <Banner
      v-if="hiddenHarvesterCount"
      color="info"
      :label="t('fleet.clusters.harvester', {count: hiddenHarvesterCount} )"
    />
    <FleetClusters
      :rows="filteredRows"
      :schema="schema"
      :loading="loading"
      :can-paginate="canPaginate"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :external-pagination-enabled="canPaginate"
      :external-pagination-result="paginationResult"
      @pagination-changed="paginationChanged"
    />
  </div>
</template>
