<script>
import { formatSi } from '@/utils/units';

export default {
  props: {
    value: {
      type:    Number,
      default: () => []
    }
  },
  computed: {
    formattedValue() {
      return formatSi(this.value, { suffix: 'B', firstSuffix: '' });
    }
  }
};
</script>

<template>
  <span>{{ formattedValue }}</span>
</template>
