<script>
export default {
  props: {
    value: {
      type:     Array,
      default: () => []
    }
  },

  computed: {
    string() {
      return this.value ? this.value.join(', ') : '';
    }
  },
};
</script>

<template>
  <span>
    {{ string }}
  </span>
</template>
