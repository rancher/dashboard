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

      return this.row?.detailUrl;
    },
  }
};
</script>

<template>
  <span>
    <nuxt-link :to="to">
      {{ value }}
    </nuxt-link>
  </span>
</template>
