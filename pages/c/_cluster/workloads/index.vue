<script>
import { STATE, AGE, NAME } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import { WORKLOAD } from '@/config/types';
export default {
  components: { SortableTable },
  computed:   {

    schema() {
      return this.$store.getters['cluster/schemaFor'](this.resource);
    },

    headers() {
      return [STATE,
        NAME,
        {
          name:      'endpoints',
          label:     'Endpoints',
          formatter: 'Endpoints',
          value:     "$['metadata']['annotations']['field.cattle.io/publicEndpoints']"
        },
        AGE,
      ];
    },

    filteredRows() {
      const isAll = this.$store.getters['isAllNamespaces'];

      // If the resources isn't namespaced or we want ALL of them, there's nothing to do.
      if ( !this.namespaced || isAll ) {
        return this.resources;
      }

      const includedNamespaces = this.$store.getters['namespaces']();

      return this.resources.filter((row) => {
        return !!includedNamespaces[row.metadata.namespace] && !row.metadata?.ownerReferences;
      });
    },
  },

  async asyncData({ store }) {
    const types = Object.values(WORKLOAD);

    let resources = await Promise.all(types.map((type) => {
      // You may not have RBAC to see some of the types
      if ( !store.getters['cluster/schemaFor'](type) ) {
        return null;
      }

      return store.dispatch('cluster/findAll', { type });
    }));

    resources = resources.reduce((all, rows) => {
      if ( rows ) {
        all.push(...rows);
      }

      return all;
    }, []);

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
    <SortableTable
      :rows="filteredRows"
      :headers="headers"
      key-field="id"
      :paging="true"
      paging-label="sortableTable.paging.workload"
    />
  </div>
</template>
