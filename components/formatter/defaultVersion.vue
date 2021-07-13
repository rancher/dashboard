<script>
export default {
  props:      {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },

  computed: {
    isDefaultVersion() {
      return this.row.defaultVersion === this.row?.status?.version;
    }
  }
};
</script>

<template>
  <div v-if="isDefaultVersion">
    <i class="icon icon-lg icon-checkmark" />
  </div>
</template>
