<script>
import ResourceTable from '@shell/components/ResourceTable';
import { WORKLOAD_TYPES, SCHEMA, NODE, POD } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

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

  Object.values(WORKLOAD_TYPES).forEach((type) => {
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
    // if (!this.resourceQueryMethods?.setPage) {
    if ( this.allTypes && this.loadResources.length && !this.advancedWorker ) {
      // if (this.allTypes && this.loadResources.length) {
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

    if ( this.allTypes && this.loadResources.length && !this.advancedWorker ) {
      this.resources = await Promise.all(this.loadResources.map((allowed) => {
        return this.$fetchType(allowed, this.loadResources);
      }));
    } else if (this.allTypes && this.loadResources.length ) {
      // workloads is a weird case, in this case we're just synthesizing a resource type on the backend and letting the worker create it
      const res = await this.$store.dispatch('cluster/findAll', { type: 'workload', opt: { resourceQuery: this.resourceQuery(schema) } });

      // resources = [res];
      this.resources = [res];
    } else {
      const type = this.$route.params.resource;

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$fetchType(type);

        this.resources = [resource];
      }
    }
    // ToDo: SM this is inelegant, come back to it
    // } else {
    //   const type = this.$route.params.resource;
    //   const resource = await this.$fetchType(type);

    //   this.resources = [resource];
    // }
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

    schema() {
      const { params:{ resource:type } } = this.$route;

      if (type !== schema.id) {
        return this.$store.getters['cluster/schemaFor'](type);
      }

      return schema;
    },

    filteredRows() {
      if (this.advancedWorker) {
        const type = this.$route.params.resource;
        const inStore = this.$store.getters['currentStore'](type);

        return this.$store.getters[`${ inStore }/all`](type);
      }
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
    advancedWorker() {
      return !!this.perfConfig?.advancedWorker?.enabled;
    },
    listLength() {
      const type = this.$route.params.resource;

      return this.$store.getters['cluster/listLength'](type);
    },
    totalLength() {
      const type = this.$route.params.resource;

      return this.$store.getters['cluster/totalLength'](type);
    }
  },

  // All of the resources that we will load that we need for the loading indicator
  $loadingResources($route, $store) {
    return $loadingResources($route, $store);
  },

  methods: {
    loadHeathResources() {
      // Fetch these in the background to populate workload health
      if ( this.allTypes && !this.advancedWorker ) {
        this.$fetchType(POD);
        this.$fetchType(WORKLOAD_TYPES.JOB);
      } else {
        const type = this.$route.params.resource;

        if (type === WORKLOAD_TYPES.JOB) {
          // Ignore job (we're fetching this anyway, plus they contain their own state)
        }

        if (!this.perfConfig?.advancedWorker) {
          if (type === WORKLOAD_TYPES.CRON_JOB) {
            this.$fetchType(WORKLOAD_TYPES.JOB);
          } else {
            this.$fetchType(POD);
          }
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
  <span>
    <ResourceTable
      :loading="$fetchState.pending"
      :schema="schema"
      :rows="filteredRows"
      :overflow-y="true"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :set-page-fn="resourceQueryMethods.setPage"
      :set-search-fn="resourceQueryMethods.setSearch"
      :set-sort-fn="resourceQueryMethods.setSort"
      :list-length="listLength"
    />
  </span>
</template>
