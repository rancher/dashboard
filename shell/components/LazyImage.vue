<script>
import $ from 'jquery';

export default {
  props: {
    initialSrc: {
      type:    String,
      default: require('~shell/assets/images/generic-catalog.svg'),
    },

    errorSrc: {
      type:    String,
      default: require('~shell/assets/images/generic-catalog.svg'),
    },

    src: {
      type:    String,
      default: null,
    },
  },

  watch: {
    src(neu, old) {
      if (neu !== old) {
        this.loadImage();
      }
    }
  },

  mounted() {
    this.loadImage();
  },

  beforeDestroy() {
    const $img = $(this.$refs.img);

    if ( $img?.length ) {
      $img.off('error', this.boundError);
    }
  },

  methods: {
    // Ensure we load the image when the source changes
    loadImage() {
      const $img = $(this.$refs.img);

      if ( this.src ) {
        $img.attr('src', this.src);
        this.boundError = this.onError.bind(this);

        $img.on('error', this.boundError);
      }
    },

    onError() {
      const $img = $(this.$refs.img);

      if ( $img?.length ) {
        $img.attr('src', this.errorSrc);
      }
    }
  }
};
</script>

<template>
  <img
    ref="img"
    :src="initialSrc"
    v-bind="$attrs"
  >
</template>
