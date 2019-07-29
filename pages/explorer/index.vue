
<template>
  <div>
    Explorer Index

    <p>Before</p>
    <SortableTable />
    <p>After</p>

    <table width="100%">
      <thead>
        <tr>
          <th v-for="col in data.columnDefinitions" :key="col.name" align="left">
            {{ col.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data.rows" :key="row.object.metadata.uid">
          <td v-for="(cell, idx) in row.cells" :key="idx">
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import SortableTable from '@/components/SortableTable.vue';

export default {
  components: { SortableTable },

  asyncData(ctx) {
    const podDef = ctx.store.getters['k8s/getResource']('pods');

    return ctx.$axios.get(podDef.basePath, { headers: { accept: 'application/json;as=Table;g=meta.k8s.io;v=v1beta1' } });
  }
};
</script>
