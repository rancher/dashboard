<script>
import ResourceTable from '@shell/components/ResourceTable';
import { WORKLOAD_TYPES, SCHEMA, NODE, POD } from '@shell/config/types';

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
      resources = await Promise.all(Object.values(WORKLOAD_TYPES).map((type) => {
      // You may not have RBAC to see some of the types
        if ( !this.$store.getters['cluster/schemaFor'](type) ) {
          return null;
        }

        return this.$store.dispatch('cluster/findAll', { type });
      }));
    } else {
      const type = this.$route.params.resource;

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$store.dispatch('cluster/findAll', { type });

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
  <ResourceTable :loading="$fetchState.pending" :schema="schema" :rows="rows" :overflow-y="true" />
</template>
