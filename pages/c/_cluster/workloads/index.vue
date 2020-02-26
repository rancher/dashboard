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
          name:      'ports',
          label:     'Ports',
          value:     '$.spec.template.spec.containers[0].ports',
          formatter: 'Port'
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

  asyncData(ctx) {
    const types = Object.values(WORKLOAD);

    return Promise.all( types.map((type) => {
      return ctx.store.dispatch('cluster/findAll', { type });
    }))
      .then((resources) => {
        resources =
        resources.reduce((all, rows) => {
          all.push(...rows);

          return all;
        }, []);

        return { resources };
      });
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
