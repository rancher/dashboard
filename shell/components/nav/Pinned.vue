<script>
export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    isClusterPinned() {
      return this.cluster.isClusterPinned;
    }
  },

  methods: {
    toggle() {
      if ( this.isClusterPinned ) {
        this.$store.dispatch('type-map/unpinCluster', this.cluster.id);
        // this.cluster.unpinCluster();
      } else {
        this.$store.dispatch('type-map/pinCluster', this.cluster.id);
        // this.cluster.pinCluster();
      }
    }
  }
};
</script>

<template>
  <i
    :tabindex="0"
    :aria-checked="!!isClusterPinned"
    class="pin icon"
    :class="{'icon-pin-outlined': !isClusterPinned, 'icon-pin': isClusterPinned}"
    aria-role="button"
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
