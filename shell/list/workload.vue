<script>
import ResourceTable from '@shell/components/ResourceTable';
import {
  WORKLOAD_TYPES, SCHEMA, NODE, POD
} from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';

const workloadSchema = {
  id:         'workload',
  type:       SCHEMA,
  attributes: {
    kind:       'Workload',
    namespaced: true
  },
  metadata: { name: 'workload' },
};

const $loadingResources = ($route, $store) => {
  return {
    loadResources:     [$route.params.resource],
    loadIndeterminate: false,
  };
};

export default {
  name:       'ListWorkload',
  components: { ResourceTable, PaginatedResourceTable },
  mixins:     [ResourceFetch],

  props: {
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    if (this.paginationEnabled) {
      return;
    }

    this.$initializeFetchData(this.$route.params.resource);

    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        // Used for shell/components/formatter/Endpoints.vue (too see column page needs to be wide and per page setting 25 or under)
        this.$fetchType(NODE);
      }
    } catch {}

    this.loadHeathResources();

    const type = this.$route.params.resource;

    if ( this.$store.getters['cluster/schemaFor'](type) ) {
      const resource = await this.$fetchType(type);

      this.resources = [resource];
    }
  },

  data() {
    // Ensure these are set on load (to determine if the NS filter is required) rather than too late on `fetch`
    const { loadResources, loadIndeterminate } = $loadingResources(this.$route, this.$store);

    const { params:{ resource: type } } = this.$route;
    const schema = type !== workloadSchema.id ? this.$store.getters['cluster/schemaFor'](type) : workloadSchema;
    const paginationEnabled = this.$store.getters[`cluster/paginationEnabled`]?.({ id: type });

    const workloadIncludeAssociatedData = paginationEnabled && [
      WORKLOAD_TYPES.DEPLOYMENT,
      WORKLOAD_TYPES.DAEMON_SET,
      WORKLOAD_TYPES.STATEFUL_SET,
      WORKLOAD_TYPES.JOB,
    ].includes(type);

    return {
      schema,
      paginationEnabled,
      resources: [],
      loadResources,
      loadIndeterminate,
      workloadIncludeAssociatedData
    };
  },

  computed: {
    filteredRows() {
      const out = [];

      for ( const typeRows of this.resources ) {
        if ( !typeRows ) {
          continue;
        }

        for ( const row of typeRows ) {
          if (!row.ownedByWorkload) {
            out.push(row);
          }
        }
      }

      return out;
    },

    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema, false);
    }
  },

  // All of the resources that we will load that we need for the loading indicator
  $loadingResources($route, $store) {
    return $loadingResources($route, $store);
  },

  methods: {
    /**
     * Fetch resources required to populate POD_RESTARTS and WORKLOAD_HEALTH_SCALE columns
     */
    loadHeathResources() {
      if (this.paginationEnabled) {
        // When SSP is enabled we efficiently fetch stats for health column imbedded in the original resource type by supplying `includeAssociatedData` param
        return;
      }

      // Fetch these in the background
      const type = this.$route.params.resource;

      if (type === WORKLOAD_TYPES.JOB || type === POD) {
        // Ignore job and pods (we're fetching this anyway, plus they contain their own state)
        return;
      }

      if (type === WORKLOAD_TYPES.CRON_JOB) {
        this.$fetchType(WORKLOAD_TYPES.JOB);
      } else {
        this.$fetchType(POD);
      }
    }
  },

  typeDisplay() {
    // Used by shell/components/ResourceList/index.vue to override list title (usually found via schema, which doesn't exist for this virtual type)
    return this.$store.getters['type-map/labelFor'](this.schema || workloadSchema, 99);
  },
};
</script>

<template>
  <div>
    <PaginatedResourceTable
      v-if="paginationEnabled"
      :schema="schema"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :includeAssociatedData="workloadIncludeAssociatedData"
    />
    <ResourceTable
      v-else
      :loading="$fetchState.pending"
      :schema="schema"
      :headers="headers"
      :rows="filteredRows"
      :overflow-y="true"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>
</template>
