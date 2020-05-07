<script>
import BadgeState from '@/components/BadgeState';

export default {
  components: { BadgeState },
  props:      {
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
      default: () => {}
    },
  },
};
</script>

<template>
  <BadgeState :value="row" />
</template>
