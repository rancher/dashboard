<script>
import LinkDetail from './LinkDetail';

export default {
  components: { LinkDetail },
  props:      {
    value: {
      type:     Array,
      default: () => []
    },
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
};
</script>

<template>
  <span>
    <LinkDetail v-for="el in value" :key="el.key" :row="row" v-bind="el" />
  </span>
</template>
