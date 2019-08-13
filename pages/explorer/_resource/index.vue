
<template>
  <div>
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

  asyncData(ctx) {
    return ctx.store.dispatch('v1/findAll', { type: ctx.params.resource }).then((rows) => {
      return { rows };
    });
  },
};
</script>
