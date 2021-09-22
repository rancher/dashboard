<script>
export default {
  props: {
    value: {
      type:    String,
      default: ''
    }
  },
  computed: {
    capitalized() {
      return this.value.charAt(0).toUpperCase() + this.value.slice(1);
    }
  }
};
</script>

<template>
  <span>
    {{ capitalized }}
  </span>
</template>
