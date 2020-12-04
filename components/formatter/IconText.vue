<script>
import { get } from '@/utils/object';

export default {
  props:      {
    row: {
      type:     Object,
      required: true,
    },

    value: {
      type:     String,
      default: '',
    },

    iconClass: {
      type:    String,
      default: null,
    },

    iconSize: {
      type:    String,
      default: null,
    },

    iconKey: {
      type:    String,
      default: null,
    },

    getIcon: {
      type:    Function,
      default: null
    }
  },

  computed: {
    displayClass() {
      if (this.getIcon) {
        return this.getIcon(this.row);
      }
      if ( this.iconKey ) {
        return get(this.row, this.iconKey);
      }

      return this.iconClass;
    }
  },
};
</script>

<template>
  <span><i v-if="displayClass" :class="{'icon': true, [displayClass]: true, [iconSize]: true}" /> {{ value }}</span>
</template>
