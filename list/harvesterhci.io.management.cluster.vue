<script>
import ResourceTable from '@/components/ResourceTable';
import { NAME as VIRTUAL } from '@/config/product/virtual';

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
          <n-link
            v-if="row.isReady"
            :to="{
              name: 'c-cluster-product',
              params: {
                cluster: row.id,
                product: VIRTUAL,
              }
            }"
          >
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
