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

  data() {
    return { copied: false };
  },

  methods: {
    clicked(event) {
      if (!this.copied) {
        event.preventDefault();
        this.$copyText(this.text);
        this.copied = true;

        let t = event.target;

        if (t.tagName === 'I') {
          t = t.parentElement || t;
        }
        t.classList.add('copied');
        setTimeout(() => {
          try {
            t.classList.remove('copied');
            this.copied = false;
          } catch (_e) {}
        }, 500);
      }
    },
  }
};
</script>

<template>
  <a class="copy-to-clipboard-text" :class="{'plain': plain}" href="#" @click="clicked">
    {{ text }} <i v-if="!copied" class="icon icon-copy" /><i v-else class="icon icon-checkmark" />
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

    &.copied {
      pointer-events: none;
      color: var(--success);
    }
  }
</style>
