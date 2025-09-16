<script setup lang="ts">
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';
import { Row } from '@shell/components/Resource/Detail/Metadata/KeyValue.vue';
import Preview from '@shell/components/Resource/Detail/Preview/Preview.vue';
import { nextTick, ref } from 'vue';
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import RcButton from '@components/RcButton/RcButton.vue';

export interface RectangleProps {
    row: Row;
}

const props = defineProps<RectangleProps>();
const showPreview = ref(false);
const element = ref<HTMLElement | null>(null);
const button = ref<HTMLElement | null>(null);

const onClose = (keyboardExit: boolean) => {
  showPreview.value = false;
  if (keyboardExit) {
    nextTick(() => {
      button.value?.focus();
    });
  }
};
</script>

<template>
  <div
    ref="element"
    class="rectangle"
    :class="{'show-preview': showPreview}"
  >
    <RcButton
      ref="button"
      ghost
      @click="() => showPreview = true"
    >
      <RcTag
        type="active"
        :highlight="showPreview"
      >
        <span class="tag-data">{{ props.row.key }}: {{ props.row.value }}</span>
      </RcTag>
    </RcButton>
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
    $ellipsis-padding: 22px;

    display: inline-block;
    position: relative;
    padding: 0;

    &, .btn, .rc-tag {
      max-width: calc(100%);
    }

    .rc-tag {
      display: inline-block;
    }

    .tag-data {
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: calc(100%);
      line-height: normal;
    }

    & .btn {
      line-height: initial;
      min-height: initial;
    }

    &.show-preview {
      .copy-to-clipboard {
        position: fixed;
      }
    }

    .copy-to-clipboard {
      position: fixed;

      right: -20px;
      top: -9px;
      z-index: 20px;
    }

    button:focus-visible, button:hover, .copy-to-clipboard:focus-visible {
      .rc-tag .tag-data {
        // This alters the ellipsis so we show more letters when the clipboard button is visible and occluding parts of the tag
        padding-right: $ellipsis-padding;
      }

      & + .copy-to-clipboard {
        position: absolute;
      }
    }

    .copy-to-clipboard:focus-visible, .copy-to-clipboard:hover {
      position: absolute;

    }

    .btn:has(+ .copy-to-clipboard:focus-visible), .btn:has(+ .copy-to-clipboard:hover)  {
      .rc-tag .tag-data {
        // This alters the ellipsis so we show more letters when the clipboard button is visible and occluding parts of the tag
        padding-right: $ellipsis-padding;
      }
    }
}
</style>
