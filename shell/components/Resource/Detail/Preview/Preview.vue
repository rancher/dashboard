<script lang="ts" setup>
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';
import Content from '@shell/components/Resource/Detail/Preview/Content.vue';
import { useBasicSetupFocusTrap } from '@shell/composables/focusTrap';
import { computed, onMounted, ref } from 'vue';

export interface Props {
  title: string;
  value: string;
  anchorElement: HTMLElement | null;
}

defineOptions({ inheritAttrs: false });

const props = defineProps<Props>();
const emit = defineEmits<{(e: 'close', keyboardExit: boolean): void}>();
const boundingRect = computed(() => props.anchorElement?.getBoundingClientRect());
const top = computed(() => `${ (boundingRect.value?.top || 0) - 28 }px`);
const right = computed(() => `${ (document.documentElement.clientWidth - (boundingRect.value?.left || 0)) + 16 }px`);
const containerRef = ref<HTMLElement | null>(null);
const escapePressed = ref(false);
const isMouseInteraction = ref(false);

const onFocusOut = (e: FocusEvent) => {
  // Refocus the container if the user clicks a child element (copy to clipboard)
  if (!escapePressed.value && containerRef.value?.contains(e.relatedTarget as Node)) {
    if (isMouseInteraction.value) {
      containerRef.value.focus();
    }
  } else {
    emit('close', escapePressed.value);
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    escapePressed.value = true;
    containerRef.value?.blur();
  }
};

onMounted(() => {
  containerRef.value?.focus();
});

useBasicSetupFocusTrap('#focus-trap-preview-container-element');

</script>
<template>
  <Teleport to="#preview">
    <div
      id="focus-trap-preview-container-element"
      ref="containerRef"
      class="preview"
      tabindex="-1"
      @keydown="onKeydown"
      @focusout="onFocusOut"
      @mousedown="isMouseInteraction=true"
      @mouseup="isMouseInteraction=false"
    >
      <div class="title">
        {{ props.title }}
      </div>
      <Content
        class="content"
        :value="props.value"
      />
      <CopyToClipboard
        class="copy-to-clipboard"
        :value="props.value"
      />
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.preview-mouse-catcher {
  cursor: default;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 120;
}
.preview {
  cursor: default;
  position: fixed;
  right: v-bind(right);
  top: v-bind(top);
  z-index: 121;
  display: flex;
  flex-direction: column;
  min-width: 420px;
  max-width: 550px;
  max-height: 550px;

  padding: 16px;

  background-color: var(--body-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);

  &:focus {
    outline: none;
  }

  .title {
    margin-bottom: 16px;

    font-size: 14px;
    font-style: normal;
    font-weight: 400;
  }

  .content {
    flex: 1;

    overflow: scroll;
  }

  .copy-to-clipboard {
      position: absolute;
      right: -8px;
      top: -8px;
  }
}
</style>
