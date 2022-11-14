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
    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        this.$store.dispatch('cluster/findAll', { type: NODE });
      }
    } catch {}

    let resources;

    this.loadHeathResources();

    if ( this.allTypes ) {
      const allowedResources = [];

      Object.values(WORKLOAD_TYPES).forEach((type) => {
        // You may not have RBAC to see some of the types
        if (this.$store.getters['cluster/schemaFor'](type) ) {
          allowedResources.push(type);
        }
      });

      resources = await Promise.all(allowedResources.map((allowed) => {
        return this.$fetchType(allowed, allowedResources);
      }));
    } else {
      const type = this.$route.params.resource;

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$fetchType(type);

        resources = [resource];
      }
    }

    this.resources = resources;
  },

  data() {
    return { resources: [] };
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
  },

  // All of the resources that we will load that we need for the loading indicator
  $loadingResources(route, store) {
    const allTypes = route.params.resource === schema.id;

    const allowedResources = [];

    Object.values(WORKLOAD_TYPES).forEach((type) => {
      // You may not have RBAC to see some of the types
      if (store.getters['cluster/schemaFor'](type) ) {
        allowedResources.push(type);
      }
    });

    return {
      loadResources:     allTypes ? allowedResources : [route.params.resource],
      loadIndeterminate: allTypes,
    };
  },

  methods: {
    loadHeathResources() {
      // Fetch these in the background to populate workload health
      if ( this.allTypes ) {
        this.$store.dispatch('cluster/findAll', { type: POD });
        this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB });
      } else {
        const type = this.$route.params.resource;

        if (type === WORKLOAD_TYPES.JOB) {
          // Ignore job (we're fetching this anyway, plus they contain their own state)
          return;
        }

        if (type === WORKLOAD_TYPES.CRON_JOB) {
          this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB });
        } else {
          this.$store.dispatch('cluster/findAll', { type: POD });
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
    :rows="filteredRows"
    :overflow-y="true"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  />
</template>
