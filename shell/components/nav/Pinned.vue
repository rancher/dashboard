<script>
export default {
  props: {
    clusterId: {
      type:     String,
      required: true,
    }
  },

  computed: {
    isPinned() {
      return this.$store.getters['type-map/isPinned'](this.clusterId);
    }
  },

  methods: {
    toggle() {
      if ( this.isPinned ) {
        this.$store.dispatch('type-map/removePin', this.clusterId);
      } else {
        this.$store.dispatch('type-map/addPin', this.clusterId);
      }
    }
  }
};
</script>

<template>
  <i
    :tabindex="0"
    :aria-checked="!!isPinned"
    class="pin icon"
    :class="{'icon-pin-outlined': !isPinned, 'icon-pin': isPinned}"
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
