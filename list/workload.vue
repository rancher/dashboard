<script>
import ResourceTable from '@/components/ResourceTable';
import { WORKLOAD_TYPES, SCHEMA } from '@/config/types';
import Loading from '@/components/Loading';

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
  components: { Loading, ResourceTable },

  async fetch() {
    const types = Object.values(WORKLOAD_TYPES);
    const { params:{ resource:type } } = this.$route;
    let resources;

    if (type !== schema.id) {
      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$store.dispatch('cluster/findAll', { type });

        resources = [resource];
      }
    } else {
      resources = await Promise.all(types.map((type) => {
      // You may not have RBAC to see some of the types
        if ( !this.$store.getters['cluster/schemaFor'](type) ) {
          return null;
        }

        return this.$store.dispatch('cluster/findAll', { type });
      }));
    }

    this.resources = resources;
  },

  data() {
    return { resources: [] };
  },

  computed: {
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
          if ( !row.metadata?.ownerReferences ) {
            out.push(row);
          }
        }
      }

      return out;
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
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" />
</template>
