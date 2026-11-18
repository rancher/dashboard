<script>
import { isArray } from '@shell/utils/array';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { announce } from '@shell/utils/aria-announce';

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

        // The only feedback here is a tooltip, which a screen reader never reads out.
        announce(this.copiedLabel);

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
    // `asyncButton.copy.*` rather than new keys, so this keeps working unchanged when a newer
    // @rancher/shell runs inside an older Rancher - both keys have been there for a long time.
    // `typeof exists === 'function'` guard: tests that mount a parent component may not set up
    // `i18n/exists` in their store mock, and this computed is evaluated regardless of render.
    copiedLabel() {
      const exists = this.$store.getters['i18n/exists'];
      const t = this.$store.getters['i18n/t'];

      return typeof exists === 'function' && exists('asyncButton.copy.success') ? t('asyncButton.copy.success') : 'Copied!';
    },

    tooltip() {
      const exists = this.$store.getters['i18n/exists'];
      const t = this.$store.getters['i18n/t'];
      const prompt = typeof exists === 'function' && exists('asyncButton.copy.action') ? t('asyncButton.copy.action') : 'Click to Copy';
      const content = this.copied ? this.copiedLabel : prompt;

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
