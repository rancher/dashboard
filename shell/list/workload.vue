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

  async fetch() {
    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        this.$store.dispatch('cluster/findAll', { type: NODE });
      }
    } catch {}

    this.loadHeathResources();

    if ( this.allTypes ) {
      await Promise.all(this.allowedResources.map((allowed) => {
        return this.$fetchType(allowed, this.allowedResources);
      }));
    } else {
      const type = this.$route.params.resource;

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        await this.$fetchType(type);
      }
    }
  },
  data() {
    const allowedResources = [];

    Object.values(WORKLOAD_TYPES).forEach((type) => {
      // You may not have RBAC to see some of the types
      if (this.$store.getters['cluster/schemaFor'](type) ) {
        allowedResources.push(type);
      }
    });

    return { allowedResources };
  },

  computed: {
    allTypes() {
      return this.$route.params.resource === schema.id;
    },

    resources() {
      if (this.allTypes) {
        const resources = [];

        this.allowedResources.forEach((type) => {
          const resource = this.$store.getters['cluster/all'](type);

          resources.push(resource);
        });

        return resources;
      } else {
        const inStore = this.$store.getters['currentStore'](this.$route.params.resource);

        return [this.$store.getters[`${ inStore }/all`](this.$route.params.resource)];
      }
    },

    loading() {
      return this.resources.length ? false : this.$fetchState.pending;
    },

    schema() {
      const { params:{ resource:type } } = this.$route;

      if (type !== schema.id) {
        return this.$store.getters['cluster/schemaFor'](type);
      }

      return schema;
    },

    rows() {
      const out = [];

      for ( const typeRows of this.resources ) {
        if ( !typeRows ) {
          continue;
        }

        for ( const row of typeRows ) {
          if (!this.allTypes || row.showAsWorkload) {
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
  <ResourceTable :loading="loading" :schema="schema" :rows="rows" :overflow-y="true" />
</template>
