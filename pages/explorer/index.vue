
<template>
  <div>
    Explorer Index

    <SortableTable
      :columns="columns"
      :rows="rows"
      key-field="metadata.uid"
      group-by="name"
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
      return this.columnDefinitions.map(x => ({
        name:  x.name.toLowerCase(),
        label: x.name,
        sort:  [x.name, 'metadata.uid'],
      }));
    }
  },

  async asyncData(ctx) {
    const podDef = ctx.store.getters['k8s/getResource']('pods');

    const res = await ctx.$axios.get(podDef.basePath, { headers: { accept: 'application/json;as=Table;g=meta.k8s.io;v=v1beta1' } });

    return res.data;
  }
};
</script>
