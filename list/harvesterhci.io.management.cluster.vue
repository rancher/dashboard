<script>
import ResourceTable from '@/components/ResourceTable';

export default {

  components: { ResourceTable },
  props:      {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :sub-rows="true"
    :is-creatable="true"
  >
    <template #col:name="{row}">
      <td>
        <span>
          <n-link v-if="row.isReady" :to="{ name: 'c-cluster-virtual', params: { cluster: row.id }}">
            {{ row.nameDisplay }}
          </n-link>
          <span v-else>
            {{ row.nameDisplay }}
          </span>
        </span>
      </td>
    </template>
  </ResourceTable>
</template>
