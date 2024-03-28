<script>
export default {
  props: {
    value: {
      type:    Object,
      default: () => ({})
    },
  },
};
</script>

<template>
  <div>
    <span>
      {{ value.main }}
    </span>
    <div class="text-muted">
      {{ value.details }}
    </div>
  </div>
</template>
