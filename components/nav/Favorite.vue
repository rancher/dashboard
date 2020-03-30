<script>
export default {
  props: {
    resource: {
      type:     String,
      required: true,
    }
  },

  data() {
    return { over: false };
  },

  computed: {
    isFavorite() {
      return this.$store.getters['type-map/isFavorite'](this.resource);
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
    class="favorite icon"
    :class="{'icon-star-open': !(over ^ isFavorite), 'icon-star': !!(over ^ isFavorite)}"
    @click.stop.prevent="toggle"
    @mouseenter="over = true"
    @mouseleave="over = false"
  />
</template>

<style lang="scss" scoped>
  .favorite {
    position: relative;
    top: -5px;
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
