<script setup lang="ts">
/**
 * A multiline text field whose contents can also be populated from a file,
 * either with the "Read from File" button or by dropping a file onto the text
 * area. Used for pasted blobs such as certificates and private keys.
 */
import { computed, ref, useAttrs, type StyleValue } from 'vue';
import { useStore } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import FileSelector, { readFileContents } from '@shell/components/form/FileSelector.vue';
import { useI18n } from '@shell/composables/useI18n';
import { _VIEW } from '@shell/config/query-params';

defineOptions({ inheritAttrs: false });

type TransformFile = (contents: string) => string;

const props = withDefaults(defineProps<{
  value?: string;
  label?: string;
  labelKey?: string;
  placeholder?: string;
  placeholderKey?: string;
  mode?: string;
  name?: string;
  /** Text area flavour: plain or masked. */
  type?: 'multiline' | 'multiline-password';
  required?: boolean;
  disabled?: boolean;
  rules?: Array<any>;
  /** Height the text area never shrinks below, in pixels. */
  minHeight?: number;
  /** Height the text area never grows beyond, in pixels, after which it scrolls. */
  maxHeight?: number;
  /** File types the file picker offers, as an `accept` attribute value. */
  accept?: string;
  /** Maximum accepted file size in bytes. `0` means no limit. */
  byteLimit?: number;
  /** Test id for the "Read from File" button. */
  fileSelectorTestid?: string;
  /** Applied to file contents before they land in the field, e.g. to base64-encode them. */
  transformFile?: TransformFile;
}>(), {
  value:              '',
  label:              undefined,
  labelKey:           undefined,
  placeholder:        undefined,
  placeholderKey:     undefined,
  mode:               undefined,
  name:               undefined,
  type:               'multiline',
  rules:              () => [],
  minHeight:          56,
  maxHeight:          200,
  accept:             '*',
  byteLimit:          0,
  fileSelectorTestid: undefined,
  transformFile:      undefined,
});

const emit = defineEmits<{(e: 'update:value', value: string): void}>();

const store = useStore();
const { t } = useI18n(store);
const attrs = useAttrs();

// class/style belong on the wrapper, every other attribute (data-testid, aria-*)
// belongs on the text area itself
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;

  return rest;
});
// Binding an undefined data-testid would strip the one FileSelector sets for itself
const fileSelectorAttrs = computed(() => (props.fileSelectorTestid ? { 'data-testid': props.fileSelectorTestid } : {}));
const rootClass = computed(() => attrs.class as string | string[] | Record<string, boolean> | undefined);
const rootStyle = computed(() => attrs.style as StyleValue);

// Nested elements fire their own dragenter/dragleave, so count entries and
// exits rather than toggling a boolean, otherwise the overlay flickers.
const dragDepth = ref(0);

// Tells a dragged file apart from text dragged around the page
const isFileDrag = (event: DragEvent) => Array.from(event.dataTransfer?.types || []).includes('Files');

// The button always reads "Read from File", so two of these on one form — a private key and a
// certificate, say — give a screen reader two buttons with identical names and nothing to tell them
// apart. The visible text stays as designed; the accessible name carries the field it fills.
const fieldLabel = computed(() => props.label || (props.labelKey ? t(props.labelKey) : ''));
const fileSelectorLabel = computed(() => (fieldLabel.value ? t('generic.readFromFileArea', { area: fieldLabel.value }) : t('generic.readFromFile')));

const isView = computed(() => props.mode === _VIEW);
const isDropTarget = computed(() => !isView.value && !props.disabled);
const isDragging = computed(() => dragDepth.value > 0);

const onSelected = (contents: string) => emit('update:value', props.transformFile ? props.transformFile(contents) : contents);

const onError = (error: unknown) => {
  store.dispatch('growl/fromError', { title: t('generic.errorReadingFile'), error }, { root: true });
};

const onDragEnter = (event: DragEvent) => {
  if (isDropTarget.value && isFileDrag(event)) {
    dragDepth.value++;
  }
};

const onDragOver = (event: DragEvent) => {
  if (isDropTarget.value && isFileDrag(event)) {
    // Without this the browser opens the dropped file instead of letting us read it
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }
};

const onDragLeave = () => {
  dragDepth.value = Math.max(0, dragDepth.value - 1);
};

const onDrop = async(event: DragEvent) => {
  if (!isDropTarget.value || !isFileDrag(event)) {
    return;
  }

  event.preventDefault();
  dragDepth.value = 0;

  const file = event.dataTransfer?.files?.[0];

  if (!file) {
    return;
  }

  if (props.byteLimit && file.size > props.byteLimit) {
    onError(t('fileSelectorTextArea.byteLimitExceeded', { name: file.name, byteLimit: props.byteLimit }));

    return;
  }

  try {
    onSelected(await readFileContents(file));
  } catch (error) {
    onError(error);
  }
};
</script>

<template>
  <div
    class="file-selector-text-area"
    :class="rootClass"
    :style="rootStyle"
  >
    <div
      class="drop-zone"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <LabeledInput
        v-bind="inputAttrs"
        :type="type"
        :value="value"
        :label="label"
        :label-key="labelKey"
        :placeholder="placeholder"
        :placeholder-key="placeholderKey"
        :mode="mode"
        :name="name"
        :required="required"
        :disabled="disabled"
        :rules="rules"
        :min-height="minHeight"
        :max-height="maxHeight"
        :resize-on-value-change-and-resize-window="true"
        @update:value="$emit('update:value', $event)"
      />
      <div
        v-if="isDragging"
        class="drop-overlay"
        data-testid="file-selector-text-area__drop-overlay"
      >
        <span>{{ t('fileSelectorTextArea.dropToReplace') }}</span>
      </div>
    </div>
    <div
      v-if="!isView"
      class="file-selector-row"
    >
      <FileSelector
        v-bind="fileSelectorAttrs"
        variant="tertiary"
        :mode="mode"
        :disabled="disabled"
        :accept="accept"
        :byte-limit="byteLimit"
        :aria-label="fileSelectorLabel"
        :label="t('generic.readFromFile')"
        @selected="onSelected"
        @error="onError"
      />
      <span class="drop-hint">{{ t('fileSelectorTextArea.dropHint') }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.file-selector-text-area {
  .drop-zone {
    position: relative;
  }

  .drop-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--primary);
    border-radius: var(--border-radius);
    backdrop-filter: blur(2px);
    color: var(--on-tertiary-hover, var(--link));
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 140%;
    text-align: center;
    // Let the drag events reach the drop zone rather than stopping at the overlay
    pointer-events: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-color: var(--tertiary-hover);
      opacity: 0.9;
    }

    span {
      position: relative;
      // Keeps the message to the design's compact, centred two-line measure
      max-width: 210px;
    }
  }

  .file-selector-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 10px;
  }

  .drop-hint {
    color: var(--input-placeholder);
    font-size: 14px;
  }
}
</style>
