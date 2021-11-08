<script>
export default {
  props: {
    value: {
      type:     [Array, String],
      default: () => []
    }
  },

  computed: {
    string() {
      if (Array.isArray(this.value)) {
        return this.value.join(', ');
      }

      return this.value;
    }
  },
};
</script>

<template>
  <span>
    {{ string }}
  </span>
</template>
