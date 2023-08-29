git pl<script>
export default {
  props: {
    clusterId: {
      type:     String,
      required: true,
    }
  },

  computed: {
    isPined() {      
      return this.$store.getters['type-map/isPined'](this.clusterId);
    }
  },

  methods: {
    toggle() {
      if ( this.isPined ) {
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
    :aria-checked="!!isPined"
    class="pin icon"
    :class="{'icon-star-open': !isPined, 'icon-star': isPined}"
    aria-role="button"
    @click.stop.prevent="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  />
</template>

<style lang="scss" scoped>
  .favorite {
    position: relative;
    cursor: pointer;
    font-size: 20px;
    transform: ease-in-out-all 1s;

    &.icon-star-open {
      color: var(--muted);
    }

    &.icon-star-closed {
      color: var(--body-text);
    }
  }
</style>
