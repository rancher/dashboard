<script>
export default {
  props: {
    text: {
      type:     String,
      required: true,
    },
    // Show as plain - don't show in link style
    plain: {
      type:    Boolean,
      default: false
    }
  },

  methods: {
    clicked(event) {
      event.preventDefault();
      this.$copyText(this.text);
    },
  }
};
</script>

<template>
  <a class="copy-to-clipboard-text" :class="{'plain': plain}" href="#" @click="clicked">
    {{ text }} <i class="icon icon-copy" />
  </a>
</template>
<style lang="scss" scoped>
  .copy-to-clipboard-text {
    &.plain {
      color: var(--body-text);

      &:hover {
        text-decoration: none;
      }
    }
  }
</style>
