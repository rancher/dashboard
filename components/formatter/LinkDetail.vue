<script>
import { get } from '@/utils/object';

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
    col: {
      type:     Object,
      required: true
    },
    opts: {
      type:    Object,
      default: null,
    }
  },

  computed: {
    to() {
      if ( this.opts?.reference ) {
        return get(this.row, this.opts.reference);
      }

      return this.row?.detailLocation;
    },
  }
};
</script>

<template>
  <span>
    <n-link :to="to">
      {{ value }}
    </n-link>
  </span>
</template>
