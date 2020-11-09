<script>
import Link from './Link';

export default {
  components: { Link },
  props:      {
    row: {
      type:     Object,
      required: true,
    },
    value: {
      type:     Array,
      default: () => []
    },
    options: {
      type:    [Object, String],
      default: null,
    },
  },
};
</script>

<template>
  <span>
    <span v-for="(el, i) in value" :key="el.key">
      <Link :row="el" :value="el" :options="el.options || options" v-bind="el" /><span v-if="i != value.length - 1">, </span>
    </span>
  </span>
</template>
