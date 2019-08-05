
<template>
  <div>
    <Test />

    Explorer Index

    <SortableTable
      :headers="headers"
      :rows="rowObjects"
      key-field="metadata.uid"
      table-actions
    />
  </div>
</template>

<script>
import { removeObject } from '../../utils/array';
import SortableTable from '@/components/SortableTable';
import Test from '@/components/Test';

export default {
  components: { SortableTable, Test },

  computed: {
    headers() {
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
      const headers = this.headers;

      for ( let i = 0 ; i < this.rows.length ; i++ ) {
        const row = this.rows[i];
        const entry = JSON.parse(JSON.stringify(row.object));

        for ( let j = 0 ; j < row.cells.length ; j++ ) {
          entry[headers[j].name] = row.cells[j];
        }

        out.push(entry);
      }

      return out;
    }
  },

  asyncData(ctx) {
    /*
    const podDef = ctx.store.getters['k8s/getResource']('pods');
    const res = await ctx.$axios.get(podDef.basePath, { headers: { accept: 'application/json;as=Table;g=meta.k8s.io;v=v1beta1' } });

    return res.data;
    */

    return {
      columnDefinitions: [],
      rows:              [],
    };
  }
};
</script>
