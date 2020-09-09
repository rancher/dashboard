<script>
import Link from './Link';

export default {
  components: { Link },
  props:      {
    value: {
      type:     Array,
      default: () => []
    }
  },
};
</script>

<template>
  <span>
    <span v-for="(el, i) in value" :key="el.key">
      <Link :value="el" /><span v-if="i != value.length - 1">, </span>
    </span>
  </span>
</template>
