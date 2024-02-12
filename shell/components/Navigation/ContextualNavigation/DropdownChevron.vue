<script>
export default {
  props: {
    open: {
      type:     Boolean,
      required: true
    },
  }
};
</script>

<template>
  <i
    v-if="open"
    class="icon toggle icon-chevron-down"
  />
  <i
    v-else
    class="icon toggle icon-chevron-right"
  />
</template>
