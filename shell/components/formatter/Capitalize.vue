<script>
export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    col: {
      type:    Object,
      default: () => {}
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
    <template v-if="!capitalized && col.dashIfEmpty">
      <span class="text-muted">&mdash;</span>
    </template>
  </span>
</template>
