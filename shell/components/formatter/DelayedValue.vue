<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    },
  },

  data() {
    return { loading: true };
  },

  computed: {
    value() {
      return this.col.value(this.row);
    }
  },

  methods: {
    startDelayedLoading() {
      this.loading = false;
    }
  }
};
</script>

<template>
  <i
    v-if="loading"
    class="icon icon-spinner delayed-loader"
  />
  <span v-else>{{ value }}</span>
</template>

<style lang="scss" scoped>
  .delayed-loader {
    font-size: 16px;
    height: 16px;
    width: 16px;
  }
</style>
