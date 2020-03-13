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
      const namespaces = this.$store.getters['namespaces'];
      const include = namespaces.filter(x => !x.startsWith('!'));
      const exclude = namespaces.filter(x => x.startsWith('!')).map(x => x.substr(1) );

      const rows = this.resources.filter((row) => {
        const inNS = include.length ? include.includes(row.metadata.namespace) : exclude.length ? !exclude.includes(row.metadata.namespace) : true;

        return (!row.metadata.ownerReferences && inNS);
      });

      return rows;
    }
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

    await store.dispatch('type-map/addRecent', 'workload');

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
    <SortableTable :rows="filteredRows" :headers="headers" key-field="id" />
  </div>
</template>
