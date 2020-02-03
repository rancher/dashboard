<script>
/* simple sortable table with key/value columns of provided object */

import SortableTable from '@/components/SortableTable';

export default {
  components: { SortableTable },
  props:      {
    rows: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const headers = [
      {
        name:  'key',
        label: 'Key',
        value: 'key',
        sort:  'key'
      },
      {
        name:  'value',
        label: 'Value',
        sort:  'value'
      }
    ];

    return { headers };
  },
  computed: {
    mappedRows() {
      const out = [];

      for (const key in this.rows) {
        out.push({ key, value: this.rows[key] });
      }

      return out;
    }
  }
};
</script>

<template>
  <SortableTable
    class="kv-table"
    :headers="headers"
    :rows="mappedRows"
    :search="false"
    :row-actions="false"
    :table-actions="false"
    key-field="key"
  />
</template>
