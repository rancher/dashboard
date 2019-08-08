
<template>
  <div>
    Explorer Index

    <SortableTable
      :headers="headers"
      :rows="rows"
      key-field="metadata.uid"
      table-actions
    />
  </div>
</template>

<script>
import SortableTable from '@/components/SortableTable';
import { NAME, CREATED } from '@/utils/table-headers';

export default {
  components: { SortableTable },

  computed: {},

  async asyncData(ctx) {
    console.log('asyncData');
    const rows = await ctx.store.dispatch('v1/findAll', { type: 'io.k8s.api.core.v1.Pod' });

    return {
      headers: [
        NAME,
        CREATED
      ],
      rows,
    };
  },

  fetch(ctx) {
    console.log('fetch');
  }
};
</script>
