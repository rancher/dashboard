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
    :class="{'icon-star-open': !isPinned, 'icon-star': isPinned}"
    aria-role="button"
    @click.stop.prevent="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  />
</template>

<style lang="scss" scoped>
  .icon {
    font-size: 14px;
  }
</style>
