<script>
import { BLANK_IMAGE } from '@shell/utils/style';

export default {
  props: {
    initialSrc: {
      type:    String,
      default: BLANK_IMAGE,
    },

    errorSrc: {
      type:    String,
      default: require('@shell/assets/images/generic-catalog.svg'),
    },

    src: {
      type:    String,
      default: null,
    },
  },

  watch: {
    src(neu, old) {
      if (neu !== old) {
        // Show error image if src is falsy
        if (!neu) {
          return this.onError();
        }

        if (this.intersected) {
          // The component is in the viewport, load the new image right away
          this.loadImage();
        } else if (!this.observer) {
          // The component is not in the viewport and not being observed,
          // which can happen if `src` was null during mount.
          // Start observing.
          this.startObserver();
        }
      }
    }
  },

  created() {
    // initialize non-reactive data
    this.observer = null;
    this.intersected = false;
    this.boundError = null;
  },

  mounted() {
    // Show error image if src is falsy
    if (!this.src) {
      this.onError();
    } else {
      this.startObserver();
    }
  },

  beforeUnmount() {
    const img = this.$refs.img;

    if (img && this.boundError) {
      img.removeEventListener('error', this.boundError);
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  },

  methods: {
    startObserver() {
      if (this.src && !this.observer && this.$refs.img) {
        this.observer = new IntersectionObserver((entries) => {
          const image = entries[0];

          if (image.isIntersecting) {
            this.intersected = true;
            this.loadImage();
            // Once the image is loaded, we don't need the observer anymore
            if (this.observer) {
              this.observer.disconnect();
              this.observer = null;
            }
          }
        });
        this.observer.observe(this.$refs.img);
      }
    },

    // Ensure we load the image when the source changes
    loadImage() {
      const img = this.$refs.img;

      if (this.src) {
        // Remove previous error listener if any
        if (img && this.boundError) {
          img.removeEventListener('error', this.boundError);
        }

        img.setAttribute('src', this.src);
        this.boundError = this.onError.bind(this);

        img.addEventListener('error', this.boundError);
      }
    },

    onError() {
      const img = this.$refs.img;

      if (img) {
        img.setAttribute('src', this.errorSrc);
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
