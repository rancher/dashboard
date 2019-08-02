
<template>
  <div>
    Explorer Index

    <SortableTable
      :columns="columns"
      :rows="rowObjects"
      key-field="name"
      table-actions
    />
  </div>
</template>

<script>
import SortableTable from '@/components/sortable-table';

export default {
  components: { SortableTable },

  computed: {
    columns() {
      return this.columnDefinitions.map((x) => {
        const lower = x.name.toLowerCase();

        return {
          name:  lower || '?',
          label: x.name,
          sort:  [lower, 'metadata.uid'],
        };
      });
    },

    rowObjects() {
      const out = [];
      const columns = this.columns;

      for ( let i = 0 ; i < this.rows.length ; i++ ) {
        const row = this.rows[i];
        const entry = JSON.parse(JSON.stringify(row.object));

        for ( let j = 0 ; j < row.cells.length ; j++ ) {
          entry[columns[j].name] = row.cells[j];
        }

        out.push(entry);
      }

      if ( process.client ) {
        window.rows = this.rows;
      }

      return out;
    }
  },

  async asyncData(ctx) {
    const podDef = ctx.store.getters['k8s/getResource']('pods');

    const res = await ctx.$axios.get(podDef.basePath, { headers: { accept: 'application/json;as=Table;g=meta.k8s.io;v=v1beta1' } });

    return res.data;
  }
};
</script>
