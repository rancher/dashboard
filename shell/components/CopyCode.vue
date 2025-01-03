<script>
import { isArray } from '@shell/utils/array';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { exceptionToErrorsArray } from '@shell/utils/error';

function flatten(node) {
  if ( node.text ) {
    return node.text;
  } else if ( isArray(node) ) {
    return node.map(flatten).join(' ');
  } else if ( node.children ) {
    if ( isArray(node.children) ) {
      return node.children.map(flatten).join(' ');
    } else {
      return node.children;
    }
  } else {
    return '';
  }
}

export default {
  emits: ['copied', 'error'],

  data() {
    return { copied: false };
  },

  methods: {
    clicked($event) {
      $event.stopPropagation();
      $event.preventDefault();

      const content = flatten(this.$slots.default()).trim();

      copyTextToClipboard(content).then(() => {
        this.copied = true;

        setTimeout(() => {
          this.copied = false;
        }, 2000);
        this.$emit('copied');
      }).catch((e) => {
        this.$emit('error', exceptionToErrorsArray(e));
      });
    },
  },

  computed: {
    tooltip() {
      const content = this.copied ? 'Copied!' : 'Click to Copy';

      return {
        content,
        hideOnTargetClick: false
      };
    }
  }
};
</script>

<template>
  <code
    v-clean-tooltip="tooltip"
    class="copy"
    @click.stop.prevent="clicked"
  ><slot /></code>
</template>

<style lang="scss" scoped>
  .copy {
    cursor: pointer;
  }
</style>
