<script>
import { isArray } from '@shell/utils/array';

function flatten(node) {
  if ( node.text ) {
    return node.text;
  } else if ( isArray(node) ) {
    return node.map(flatten).join(' ');
  } else if ( node.children ) {
    return node.children.map(flatten).join(' ');
  } else if ( node.child ) {
    return flatten(node.child);
  } else {
    return '';
  }
}

export default {
  data() {
    return { copied: false };
  },

  methods: {
    clicked($event) {
      $event.stopPropagation();
      $event.preventDefault();

      const content = flatten(this.$slots.default).trim();

      this.$copyText(content).then(() => {
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
