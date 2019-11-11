<script>
export default {
  data() {
    return { copied: false };
  },

  methods: {
    clicked($event) {
      $event.stopPropagation();
      $event.preventDefault();

      this.$copyText(this.$slots.default[0].text).then(() => {
        this.copied = true;

        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    },
  }
};
</script>

<template>
  <code v-tooltip="{'content': copied ? 'Copied!' : 'Click to Copy', hideOnTargetClick: false}" class="copy" @click.stop.prevent="clicked"><slot /></code>
</template>

<style lang="scss" scoped>
  .copy {
    cursor: pointer;
  }
</style>
