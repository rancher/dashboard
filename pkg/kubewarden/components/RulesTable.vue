<script>
import { RULE_HEADERS } from '../plugins/kubewarden/policy-class';

import { Banner } from '@components/Banner';
import SortableTable from '@shell/components/SortableTable';

export default {
  props: {
    rows: {
      type:     Array,
      default:  () => []
    }
  },

  components: { Banner, SortableTable },

  data() {
    return { RULE_HEADERS };
  },

  methods: {
    joinColumn(resource) {
      return resource?.join(', ') || '';
    }

  }
};
</script>

<template>
  <div>
    <SortableTable
      v-if="rows.length > 0"
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
          <span>{{ joinColumn(row.operations) }}</span>
        </td>
      </template>

      <template #col:resources="{row}">
        <td>
          <span>{{ joinColumn(row.resources) }}</span>
        </td>
      </template>
    </SortableTable>
    <div v-else>
      <Banner
        class="type-banner mb-20 mt-0"
        color="warning"
        :label="t('kubewarden.policies.noRules')"
      />
    </div>
  </div>
</template>
