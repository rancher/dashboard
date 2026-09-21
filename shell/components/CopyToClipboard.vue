<script>
import AsyncButton from '@shell/components/AsyncButton';
import { copyTextToClipboard } from '@shell/utils/clipboard';

export default {
  components: { AsyncButton },

  props: {
    text: {
      type:     String,
      required: true,
    },

    showLabel: {
      type:    Boolean,
      default: true,
    }
  },

  computed: {
    /**
     * These labels are what AsyncButton announces to screen readers, so they have to be
     * translated. Each falls back to the English it replaced, because a newer @rancher/shell
     * can be running inside an older Rancher whose translations don't have these keys yet -
     * without the fallback a UI Extension would render `%copyToClipboard.action%`.
     */
    labels() {
      const exists = this.$store.getters['i18n/exists'];
      const t = this.$store.getters['i18n/t'];
      const pick = (key, fallback) => typeof exists === 'function' && exists(key) ? t(key) : fallback;

      return {
        action:  pick('copyToClipboard.action', 'Copy'),
        waiting: pick('copyToClipboard.waiting', 'Copying...'),
        success: pick('copyToClipboard.success', 'Copied!'),
        error:   pick('copyToClipboard.error', 'Error Copying'),
      };
    },
  },

  methods: {
    clicked(buttonCb) {
      copyTextToClipboard(this.text).then(() => {
        buttonCb(true);
      }).catch(() => {
        buttonCb(false);
      });
    },
  }
};
</script>

<template>
  <AsyncButton
    icon="icon-copy"
    :show-label="showLabel"
    :action-label="labels.action"
    :waiting-label="labels.waiting"
    :success-label="labels.success"
    :error-label="labels.error"
    v-bind="$attrs"
    :success-color="$attrs['action-color'] || 'role-primary'"
    :waiting-color="$attrs['action-color'] || 'role-primary'"
    :delay="2000"
    @click="clicked"
  />
</template>

<style lang="scss" scoped>
.icon-btn {
  min-height: 24px;
  min-width: 24px;
  justify-content: center;
}

.bg-transparent {
  &:active {
    background-color: var(--primary-keyboard-focus);
    color: var(--primary-text);
  }

  &:focus-visible {
    @include focus-outline;
  }
}

.role-primary {
  &:active {
    background-color: var(--primary-keyboard-focus);
    color: var(--primary-text);
  }
}
</style>
