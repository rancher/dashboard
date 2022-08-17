<script>
import { RULE_HEADERS } from '../plugins/kubewarden/policy-class';

import SortableTable from '@shell/components/SortableTable';

export default {
  props: {
    rows: {
      type:     Array,
      default:  () => []
    }
  },

  components: { SortableTable },

  data() {
    return { RULE_HEADERS };
  }
};
</script>

<template>
  <div>
    <SortableTable
      v-if="rows"
      :rows="rows"
      :headers="RULE_HEADERS"
      :table-actions="false"
      :row-actions="false"
      key-field="traceID"
      default-sort-by="startTime"
    >
      <template #col:apiGroup="{row}">
        <td>
          <span>{{ row.apiGroups }}</span>
        </td>
      </template>

      <template #col:apiVersion="{row}">
        <td>
          <span>{{ row.apiVersions }}</span>
        </td>
      </template>

      <template #col:operations="{row}">
        <td>
          <span>{{ row.operations.join(', ') }}</span>
        </td>
      </template>

      <template #col:resources="{row}">
        <td>
          <span>{{ row.resources.join(', ') }}</span>
        </td>
      </template>
    </SortableTable>
  </div>
</template>
