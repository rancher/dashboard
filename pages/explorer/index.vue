
<template>
  <div>
    Explorer Index

    <SortableTable
      :headers="headers"
      :rows="filteredRows"
      key-field="metadata.uid"
      table-actions
    />
  </div>
</template>

<script>
import SortableTable from '@/components/SortableTable';
import { NAME, NAMESPACE, CREATED } from '@/utils/table-headers';
import { removeObject } from '@/utils/array';

export default {
  components: { SortableTable },

  computed: {
    headers() {
      const out = [
        NAME,
        NAMESPACE,
        CREATED
      ];

      if ( !this.$store.getters['allNamespaces'] ) {
        removeObject(out, NAMESPACE);
      }

      return out;
    },

    filteredRows() {
      if ( this.$store.getters['allNamespaces'] ) {
        return this.rows;
      }

      const namespaces = this.$store.getters['namespaces'];

      return this.rows.filter(x => namespaces.includes(x.metadata.namespace));
    }
  },

  async asyncData(ctx) {
    const rows = await ctx.store.dispatch('v1/findAll', { type: 'io.k8s.api.core.v1.Pod' });

    return { rows };
  },
};
</script>
