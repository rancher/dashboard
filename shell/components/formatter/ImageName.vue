<script>
export default {
  props:
    {
      value: {
        type:    String,
        default: ''
      }
    }
};
</script>

<template>
  <span class="formatter-image">
    {{ value }}
  </span>
</template>

<style scoped>
  .formatter-image {
    word-break: break-all;
  }
</style>
