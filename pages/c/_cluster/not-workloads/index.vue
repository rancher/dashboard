<script>
import { STATE, AGE, NAMESPACE_NAME } from '@/config/table-headers';
import ResourceTable from '@/components/ResourceTable';
import { WORKLOAD_TYPES, SCHEMA } from '@/config/types';

export default {
  components: { ResourceTable },
  computed:   {

    schema() {
      return {
        id:         'workload',
        type:       SCHEMA,
        attributes: {
          kind:       'Workload',
          namespaced: true
        },
        metadata: { name: 'workload' },
      };
    },

    headers() {
      return [
        STATE,
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

  async asyncData({ store }) {
    const types = Object.values(WORKLOAD_TYPES);

    const resources = await Promise.all(types.map((type) => {
      // You may not have RBAC to see some of the types
      if ( !store.getters['cluster/schemaFor'](type) ) {
        return null;
      }

      return store.dispatch('cluster/findAll', { type });
    }));

    await store.dispatch('type-map/addRecent', 'workloads');

    return { resources };
  },
};
</script>

<template>
  <div>
    <header>
      <h1>
        Workloads
      </h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Create
        </nuxt-link>
      </div>
    </header>
    <ResourceTable :schema="schema" :rows="rows" :headers="headers" />
  </div>
</template>
