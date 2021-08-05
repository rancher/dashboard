<script>
import { formatSi } from '@/utils/units';

export default {
  props: {
    value: {
      type:    Number,
      default: () => 0,
    },

    opts: {
      type:    Object,
      default: () => {},
    }
  },
  computed: {
    formattedValue() {
      return formatSi(this.value, {
        suffix:      'iB',
        firstSuffix: 'B',
        increment:   1024,
        ...this.opts
      });
    }
  }
};
</script>

<template>
  <span>{{ formattedValue }}</span>
</template>
