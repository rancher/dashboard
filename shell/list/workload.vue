<script>
import ResourceTable from '@shell/components/ResourceTable';
import { WORKLOAD_TYPES, SCHEMA, NODE, POD } from '@shell/config/types';
import ManualRefresh from '@shell/mixins/manual-refresh';

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
  mixins:     [ManualRefresh],

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

      if (!this.manualRefreshInit) {
        this.watch = this.gatherManualRefreshData(allowedResources);
        this.manualRefreshInit = true;
        this.force = true;
      }

      resources = await Promise.all(allowedResources.map((allowed) => {
        return this.$store.dispatch('cluster/findAll', { type: allowed, opt: { watch: this.watch, force: this.force } });
      }));
    } else {
      const type = this.$route.params.resource;

      this.resource = type;

      if (!this.manualRefreshInit) {
        this.watch = this.gatherManualRefreshData();
        this.manualRefreshInit = true;
        this.force = true;
      }

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$store.dispatch('cluster/findAll', { type, opt: { watch: this.watch, force: this.force } });

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
