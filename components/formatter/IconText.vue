<script>
export default {
  props:      {
    value: {
      type:     String,
      default: ''
    },
    iconClass: {
      type:    String,
      default: ''
    }
  },
};
</script>

<template>
  <span><i v-if="iconClass" class="icon" :class="iconClass" /> {{ value }}</span>
</template>
