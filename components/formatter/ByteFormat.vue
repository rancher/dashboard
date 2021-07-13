<script>
import { getFileSize } from '@/utils/units';

export default {
  props: {
    value: {
      type:    [Number, String],
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
  },
  computed: {
    formattedValue() {
      return getFileSize(this.value);
    }
  }
};
</script>

<template>
  <span>{{ formattedValue }}</span>
</template>
