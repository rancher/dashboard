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
    return { loading: true, restarts: 0 };
  },

  methods: {
    startDelayedLoading() {
      this.loading = false;
    },

    liveUpdate() {
      if (this.loading) {
        return;
      }

      this.restarts = this.row?.restartCount;

      return 5;
    }
  }
};
</script>

<template>
  <i
    v-if="loading"
    class="icon icon-spinner delayed-loader"
  />
  <span v-else>{{ restarts }}</span>
</template>

<style lang="scss" scoped>
  .delayed-loader {
    font-size: 16px;
    height: 16px;
    width: 16px;
  }
</style>
