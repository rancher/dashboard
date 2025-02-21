<script>
// Allow the user to pin a cluster by clicking it.
export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    },
    tabOrder: {
      type:    Number,
      default: null,
    }
  },

  computed: {
    pinned() {
      return this.cluster.pinned;
    }
  },

  methods: {
    toggle() {
      if ( this.pinned ) {
        this.cluster.unpin();
      } else {
        this.cluster.pin();
      }
    }
  }
};
</script>

<template>
  <i
    :tabindex="tabOrder"
    :aria-checked="!!pinned"
    class="pin icon"
    :class="{'icon-pin-outlined': !pinned, 'icon-pin': pinned}"
    aria-role="button"
    :aria-label="t('nav.ariaLabel.pinCluster', { cluster: cluster.label })"
    @click.stop.prevent="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  />
</template>

<style lang="scss" scoped>
  .icon {
    font-size: 14px;
    transform: scaleX(-1);
  }
</style>
