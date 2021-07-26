<script>
export default {
  components: { },
  props:      {
    row: {
      type:     Object,
      required: true,
    },
    options: {
      type:    [Object, String],
      default: null,
    },
  },
};
</script>

<template>
  <span>
    <button class="btn role-primary error">
      <i class="icon icon-error" />
    </button>
  </span>
</template>
