<script>
export default {
  props: {
    resource: {
      type:     String,
      required: true,
    }
  },

  computed: {
    isFavorite() {
      return this.$store.getters['type-map/isFavorite'](this.resource);
    },
    ariaLabel() {
      return this.t(`resourceDetail.masthead.ariaLabel.${ this.isFavorite ? 'unfavoriteAction' : 'favoriteAction' }`, { resource: this.resource });
    }
  },

  methods: {
    toggle() {
      if ( this.isFavorite ) {
        this.$store.dispatch('type-map/removeFavorite', this.resource);
      } else {
        this.$store.dispatch('type-map/addFavorite', this.resource);
      }
    }
  }
};
</script>

<template>
  <i
    :tabindex="0"
    :aria-pressed="!!isFavorite"
    class="favorite icon"
    :class="{'icon-star-open': !isFavorite, 'icon-star': isFavorite}"
    role="button"
    :aria-label="ariaLabel"
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
