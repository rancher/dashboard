<script>
export default {
  data: () => ({ loading: false }),

  methods: {
    start() {
      this.loading = true;
    },

    finish() {
      this.loading = false;
    }
  }
};
</script>

<template>
  <div v-if="loading">
    <div class="overlay"></div>
    <div class="content">
      Loading...
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import "@/assets/styles/base/_variables.scss";
  @import "@/assets/styles/base/_functions.scss";
  @import "@/assets/styles/base/_mixins.scss";

  .overlay {
    z-index: z-index('loadingOverlay');
    background-color: var(--overlay-bg);
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }

  .content {
    position: absolute;
    top: 50vh;
    left: 0;
    right: 0;
    text-align: center;
    z-index: z-index('loadingContent');
  }
</style>
