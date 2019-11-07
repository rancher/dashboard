<script>

export default {
  props: {
    value: {
      type:     Array,
      default: null,
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    },
  },

  computed: {
    bestLink() {
      if ( this.value && this.value.length ) {
        return this.value[0];
      }

      return null;
    },

    protocol() {
      const link = this.bestLink;

      if ( link ) {
        const match = link.match(/^([^:]+):\/\//);

        if ( match ) {
          return match[1];
        } else {
          return 'link';
        }
      }

      return null;
    }
  },
};
</script>

<template>
  <span>
    <a v-if="bestLink" :href="bestLink" target="_blank" rel="nofollow noopener noreferrer">
      {{ protocol }}
    </a>
    <span v-else class="text-muted">
      &mdash;
    </span>
  </span>
</template>
