<script>
import { get } from '@shell/utils/object';

export default {
  props: {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    reference: {
      type:    String,
      default: null,
    }
  },

  computed: {
    to() {
      if ( this.row && this.reference ) {
        return get(this.row, this.reference);
      }

      return this.row?.detailLocation;
    },
  }
};
</script>

<template>
  <span>
    <n-link v-if="to" :to="to">
      {{ value }}
    </n-link>
    <span v-else>{{ value }}</span>
  </span>
</template>
