<script>
import { get } from '@shell/utils/object';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:    Object,
      default: () => {}
    },
    reference: {
      type:    String,
      default: null,
    },
    getCustomDetailLink: {
      type:    Function,
      default: null
    }
  },

  computed: {
    to() {
      if (this.getCustomDetailLink) {
        return this.getCustomDetailLink(this.row);
      }
      if ( this.row && this.reference ) {
        return get(this.row, this.reference);
      }

      return this.row?.detailLocation;
    }
  }
};
</script>

<template>
  <span>
    <router-link
      v-if="to"
      :to="to"
    >
      {{ value }}
    </router-link>
    <span v-else>
      {{ value }}
      <template v-if="!value && col.dashIfEmpty">
        <span class="text-muted">&mdash;</span>
      </template>
    </span>
  </span>
</template>
