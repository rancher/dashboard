
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
import { headersFor } from '@/utils/table-headers';

export default {
  components: { SortableTable },

  computed: {
    headers() {
      const schema = this.$store.getters['v1/schemaFor'](this.$route.params.resource);
      const multipleNamespaces = this.$store.getters['multipleNamespaces'];

      return headersFor(schema, multipleNamespaces);
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
