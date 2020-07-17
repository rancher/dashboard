<script>
import LinkDetail from './LinkDetail';

export default {
  components: { LinkDetail },
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
    <LinkDetail v-for="el in value" :key="el.key" v-bind="el" />
  </span>
</template>
