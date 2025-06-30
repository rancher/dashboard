<script setup lang="ts">
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';
import { Row } from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import Preview from '@shell/components/Resource/Detail/Preview/Preview.vue';
import { ref } from 'vue';

export interface RectangleProps {
    outline?: boolean;
    row: Row;
}

const props = withDefaults(
  defineProps<RectangleProps>(),
  { outline: false }
);

const showPreview = ref(false);
const element = ref<HTMLElement | null>(null);
const button = ref<HTMLElement | null>(null);

const onClose = (keyboardExit: boolean) => {
  showPreview.value = false;
  if (keyboardExit && button.value) {
    button.value.focus();
  }
};
</script>

<template>
  <div
    ref="element"
    class="rectangle"
    :class="{outline: props.outline, 'show-preview': showPreview}"
  >
    <button
      ref="button"
      class="content"
      @click="() => showPreview = true"
    >
      {{ row.key }}: {{ row.value }}
    </button>
    <CopyToClipboard :value="row.value" />
    <Preview
      v-if="showPreview"
      class="preview"
      :title="row.key"
      :value="row.value"
      :anchor-element="element"
      aria-live="polite"
      @close="onClose"
    />
  </div>
</template>

<style lang="scss" scoped>
.rectangle {
    border: 1px solid var(--tag-bg);
    border-radius: 4px;
    background: none;
    display: inline-block;
    position: relative;
    max-width: 100%;

    &:not(.outline) {
      background-color: var(--tag-bg);
    }

    &.show-preview {
      border-color: var(--primary);

      .content, .content:hover {
        & + .copy-to-clipboard {
          position: fixed;
        }
      }
    }

    .content {
      // Override the base definition of buttons
      display: inline-block;
      color: var(--body-text);
      background: none;

      padding: 0 8px;
      height: 23px;
      line-height: 23px;
      max-width: 100%;
      min-height: initial;

      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      cursor: pointer;

      &:focus-visible {
        @include focus-outline;
      }

      &:focus-visible, &:hover {
        & + .copy-to-clipboard {
          position: absolute;
        }
      }
    }

    .copy-to-clipboard {
      position: fixed;
      &:focus-visible, &:hover {
        position: absolute;
      }

      right: -40px;
      top: -9px;
      z-index: 20px;
    }
}
</style>
