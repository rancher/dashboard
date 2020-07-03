<script>
import { STATE, AGE, NAMESPACE_NAME, TYPE } from '@/config/table-headers';
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

    const resources = await Promise.all(types.map((type) => {
      // You may not have RBAC to see some of the types
      if ( !this.$store.getters['cluster/schemaFor'](type) ) {
        return null;
      }

      return this.$store.dispatch('cluster/findAll', { type });
    }));

    this.resources = resources;
  },

  computed: {
    schema() {
      return schema;
    },

    headers() {
      return [
        STATE,
        TYPE,
        NAMESPACE_NAME,
        {
          name:      'endpoints',
          label:     'Endpoints',
          formatter: 'Endpoints',
          value:     "$['metadata']['annotations']['field.cattle.io/publicEndpoints']"
        },
        AGE,
      ];
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
    return this.$store.getters['type-map/pluralLabelFor'](schema);
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable v-else :schema="schema" :rows="rows" :headers="headers" />
</template>
