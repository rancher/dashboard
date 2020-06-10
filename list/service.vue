<script>
import SortableTable from '@/components/SortableTable';
import {
  STATE, NAME, SPEC_TYPE, TARGET_PORT, SELECTOR, AGE
} from '@/config/table-headers';

export default {
  name:       'ListService',
  components: { SortableTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },
  },

  data() {
    return { headers: [STATE, NAME, SPEC_TYPE, TARGET_PORT, SELECTOR, AGE] };
  },
};
</script>

<template>
  <SortableTable
    v-bind="$attrs"
    :headers="headers"
    :rows="[...rows]"
    key-field="_key"
    v-on="$listeners"
  />
</template>
