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
    },
    // If false Show toolTip instead of label before copy-to-clipboard icon
    showLabel: {
      type:    Boolean,
      default: true
    },
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

        setTimeout(() => {
          this.copied = false;
        }, 800);
      }
    }
  }
};
</script>

<template>
  <a
    v-tooltip="!showLabel ? {content: $store.getters['i18n/t']('generic.copyValue')} : {content: null}"
    class="copy-to-clipboard-text"
    :class="{ 'copied': copied, 'plain': plain}"
    href="#"
    @click="clicked"
  >
    <span v-if="showLabel">{{ text }}</span>
    <v-popover
      popover-class="clipboard-text-copied"
      placement="top"
      :trigger="!showLabel ? 'click' : ''"
      :open="copied && !showLabel"
    >
      <i
        class="icon"
        :class="{ 'icon-copy': !copied, 'icon-checkmark': copied}"
      />
      <template slot="popover">
        <span>{{ t('generic.valueCopied') }}</span>
      </template>
    </v-popover>
  </a>
</template>
<style lang="scss">
  .clipboard-text-copied {
    .wrapper {
      .popover-inner {
        background: var(--tooltip-bg);
      }
    }
  }
</style>
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
