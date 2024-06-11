<script>
import ResourceTable from '@shell/components/ResourceTable';
import {
  WORKLOAD_TYPES, SCHEMA, NODE, POD, LIST_WORKLOAD_TYPES
} from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { WORKLOAD_HEALTH_SCALE } from '@shell/config/table-headers';

const schema = {
  id:         'workload',
  type:       SCHEMA,
  attributes: {
    kind:       'Workload',
    namespaced: true
  },
  metadata: { name: 'workload' },
};

const $loadingResources = ($route, $store) => {
  const allowedResources = [];

  Object.values(LIST_WORKLOAD_TYPES).forEach((type) => {
    // You may not have RBAC to see some of the types
    if ($store.getters['cluster/schemaFor'](type) ) {
      allowedResources.push(type);
    }
  });

  const allTypes = $route.params.resource === schema.id;

  return {
    loadResources:     allTypes ? allowedResources : [$route.params.resource],
    loadIndeterminate: allTypes,
  };
};

export default {
  name:       'ListWorkload',
  components: { ResourceTable },
  mixins:     [ResourceFetch],

  props: {
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    if (this.allTypes && this.loadResources.length) {
      this.$initializeFetchData(this.loadResources[0], this.loadResources);
    } else {
      this.$initializeFetchData(this.$route.params.resource);
    }

    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        this.$fetchType(NODE);
      }
    } catch {}

    this.loadHeathResources();

    if ( this.allTypes ) {
      this.resources = await Promise.all(this.loadResources.map((allowed) => {
        return this.$fetchType(allowed, this.loadResources);
      }));
    } else {
      const type = this.$route.params.resource;

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$fetchType(type);

        this.resources = [resource];
      }
    }
  },

  data() {
    // Ensure these are set on load (to determine if the NS filter is required) rather than too late on `fetch`
    const { loadResources, loadIndeterminate } = $loadingResources(this.$route, this.$store);

    return {
      resources: [],
      loadResources,
      loadIndeterminate
    };
  },

  computed: {
    allTypes() {
      return this.$route.params.resource === schema.id;
    },

    paginationEnabled() {
      return !this.allTypes && this.$store.getters[`cluster/paginationEnabled`]();
    },

    schema() {
      const { params:{ resource:type } } = this.$route;

      if (type !== schema.id) {
        return this.$store.getters['cluster/schemaFor'](type);
      }

      return schema;
    },

    filteredRows() {
      const out = [];

      for ( const typeRows of this.resources ) {
        if ( !typeRows ) {
          continue;
        }

        for ( const row of typeRows ) {
          if (!this.allTypes || !row.ownedByWorkload) {
            out.push(row);
          }
        }
      }

      return out;
    },

    headers() {
      const headers = this.$store.getters['type-map/headersFor'](this.schema, false);

      if (this.paginationEnabled) {
        // See https://github.com/rancher/dashboard/issues/10417, health comes from selectors applied locally to all pods (bad)
        return headers.filter((h) => h.name !== WORKLOAD_HEALTH_SCALE.name);
      }

      return headers;
    }
  },

  // All of the resources that we will load that we need for the loading indicator
  $loadingResources($route, $store) {
    return $loadingResources($route, $store);
  },

  methods: {
    loadHeathResources() {
      // See https://github.com/rancher/dashboard/issues/10417, health comes from selectors applied locally to all pods (bad)
      if (this.paginationEnabled) {
        return;
      }

      // Fetch these in the background to populate workload health
      if ( this.allTypes ) {
        this.$fetchType(POD);
        this.$fetchType(WORKLOAD_TYPES.JOB);
      } else {
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
    }
  },

  typeDisplay() {
    const { params:{ resource:type } } = this.$route;
    let paramSchema = schema;

    if (type !== schema.id) {
      paramSchema = this.$store.getters['cluster/schemaFor'](type);
    }

    return this.$store.getters['type-map/labelFor'](paramSchema, 99);
  },
};
</script>

<template>
  <ResourceTable
    :loading="$fetchState.pending"
    :schema="schema"
    :headers="headers"
    :rows="filteredRows"
    :overflow-y="true"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  />
</template>
