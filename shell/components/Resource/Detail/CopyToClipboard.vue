<script lang="ts" setup>
import { useI18n } from '@shell/composables/useI18n';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { ref } from 'vue';
import { useStore } from 'vuex';

export interface Props {
  value: string;
}

const props = defineProps<Props>();
const store = useStore();
const i18n = useI18n(store);
const copied = ref(false);
const timeout = ref<null | ReturnType<typeof setTimeout>>(null);

const onClick = (ev: MouseEvent) => {
  ev.stopPropagation();

  copyTextToClipboard(props.value);
  copied.value = true;

  if (timeout.value) {
    return;
  }

  timeout.value = setTimeout(() => {
    copied.value = false;
    timeout.value = null;
  }, 2000);
};
</script>
<template>
  <button
    class="copy-to-clipboard"
    :class="{copied}"
    :aria-label="i18n.t('component.resource.detail.copyToClipboard.ariaLabel.copy')"
    @click="onClick"
  >
    <i class="icon icon-copy" />
  </button>
</template>

<style lang="scss" scoped>
.copy-to-clipboard {
    z-index: 2;
    display: inline-flex;
    $size: 36px;
    width: $size;
    height: $size;
    font-size: 14px;
    border-radius: 50%;
    justify-content: center;
    align-items: center;
    padding: 0;
    line-height: initial;
    min-height: initial;

    border: 1px solid var(--primary);
    color: var(--primary);

    background-color: var(--body-bg);

    &:hover {
        color: var(--body-text);
    }

    &.copied {
        background-color: var(--success);
        border-color: var(--success-border);
        color: var(--success-text);

        transition: all 0.25s;
        transition-timing-function: ease;
    }

    &:focus-visible {
      @include focus-outline;
    }
}
</style>
