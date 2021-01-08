<script>

export default {
  props: {
    value: {
      type:     [Array, String],
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
    // value may be JSON from "field.cattle.io/publicEndpoints" label
    parsed() {
      if ( this.value && this.value.length ) {
        let out ;

        try {
          out = JSON.parse(this.value);
        } catch (err) {
          return this.value[0];
        }

        return out;
      }

      return null;
    },
    bestLink() {
      if (this.parsed && this.parsed.length ) {
        if (this.parsed[0].addresses) {
          let protocol = 'http';

          if (this.parsed[0].port === 443) {
            protocol = 'https';
          }

          return `${ protocol }://${ this.parsed[0].addresses[0] }:${ this.parsed[0].port }`;
        }

        return this.parsed;
      } else {
        return null;
      }
    },

    protocol() {
      const link = this.bestLink;

      if ( link) {
        if (this.parsed[0].protocol) {
          return this.parsed[0].protocol;
        }

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
      <span v-if="parsed[0].port">{{ parsed[0].port }}/</span>{{ protocol }}
    </a>
    <span v-else class="text-muted">
      &mdash;
    </span>
  </span>
</template>
