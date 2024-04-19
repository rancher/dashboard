<script>
export default {
  name:  'LoadingIndicator',
  props: {
    loading: {
      type:    Boolean,
      default: true,
    },
    noDelay: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    return { timer: null, showMessage: this.noDelay };
  },

  mounted() {
    this.timer = setTimeout(() => {
      this.showMessage = true;
    }, 250);
  },

  beforeDestroy() {
    clearTimeout(this.timer);
  }
};
</script>

<template>
  <div
    v-if="loading"
    class="loading-indicator"
  >
    <div class="loading-indicator-message">
      <i class="icon icon-spinner icon-spin" />
      <t
        k="generic.loading"
        :raw="true"
      />
    </div>
  </div>
  <div
    v-else
    class="loaded-content"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .loading-indicator {
    align-items: center;
    display: flex;
    justify-content: center;
    flex: 1;

    .loading-indicator-message {
      align-items: center;
      display: flex;

      > i {
        font-size: 18px;
        line-height: 18px;
      }

      > span {
        margin-left: 5px;
      }
    }
  }

  .loaded-content {
    // display: flex;
    flex: 1;
  }
</style>
