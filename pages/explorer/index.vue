
<template>
  <div>
    Explorer Index

    <SortableTable :columns="this.columns" :rows="rows" groupBy="name" />
  </div>
</template>

<script>
import SortableTable from '@/components/SortableTable.vue';

export default {
  components: { SortableTable },

  computed: {
    columns() {
      return this.columnDefinitions;
    }
  },

  async asyncData(ctx) {
    const podDef = ctx.store.getters['k8s/getResource']('pods');

    const res = await ctx.$axios.get(podDef.basePath, { headers: { accept: 'application/json;as=Table;g=meta.k8s.io;v=v1beta1' } });

    return res.data;
  }
};
</script>
