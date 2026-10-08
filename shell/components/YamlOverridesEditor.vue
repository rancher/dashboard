<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import jsyaml from 'js-yaml';
import debounce from 'lodash/debounce';
import isPlainObject from 'lodash/isPlainObject';
import type { EditorView } from '@codemirror/view';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { overridesFromEditedValues, mergeOverridesRawText, changedLineNumbers, sameYamlOverrides } from '@shell/utils/chart-values';
import { setLineClasses } from '@shell/utils/code-mirror-line-classes';
import { keepSearchPanelOpen } from '@shell/utils/code-mirror-search';

/**
 * Two editable YAML panes for chart values. The left one ("defaults") shows the chart
 * defaults merged with the overrides. The right one ("overrides") shows only the values
 * that differ from the defaults, which is what `value` holds. Editing either pane
 * updates the other.
 */

// Syncing the other pane grows with the document, so it waits for typing to stop
const SYNC_DEBOUNCE_MS = 400;

const OVERRIDE_LINE_CLASS = 'line-override-highlight';

interface Props {
  value?: string;
  defaults?: object | null;
  editorMode?: string;
  chartDefaultsLabel?: string;
  chartDefaultsHint?: string;
  overridesLabel?: string;
  overridesHint?: string;
  /** CodeMirror's "Find" when empty */
  searchPlaceholder?: string;
  testidPrefix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value:              '',
  defaults:           () => ({}),
  editorMode:         EDITOR_MODES.EDIT_CODE,
  chartDefaultsLabel: '',
  chartDefaultsHint:  '',
  overridesLabel:     '',
  overridesHint:      '',
  searchPlaceholder:  '',
  testidPrefix:       'values',
});

const emit = defineEmits<{(e: 'update:value', value: string): void }>();

// YamlEditor doesn't react to its `value` prop after mount, so text is pushed in with updateValue
interface YamlEditorRef {
  updateValue(value: string): void;
}

const defaultsEditor = ref<YamlEditorRef | null>(null);
const overridesEditor = ref<YamlEditorRef | null>(null);
const searchContainer = ref<HTMLElement | null>(null);

let defaultsView: EditorView | null = null;

// The live text of each pane. An editor echoes the text we push into it back as
// update:value, and the input handlers skip it because it equals this text.
const overridesContent = ref(props.value || '');
const defaultsContent = ref(mergeOverridesRawText(props.defaults || {}, overridesContent.value));

const defaultsPaneTestid = () => `${ props.testidPrefix }-defaults-pane`;
const overridesPaneTestid = () => `${ props.testidPrefix }-overrides-pane`;
const defaultsTestid = () => `${ props.testidPrefix }-defaults`;
const overridesTestid = () => `${ props.testidPrefix }-overrides`;

function applyDefaultsDecorations() {
  if (!defaultsView) {
    return;
  }

  setLineClasses(defaultsView, changedLineNumbers(props.defaults || {}, defaultsContent.value).map((line) => ({
    line,
    className: OVERRIDE_LINE_CLASS,
  })));
}

function syncFromOverrides() {
  defaultsContent.value = mergeOverridesRawText(props.defaults || {}, overridesContent.value);

  defaultsEditor.value?.updateValue(defaultsContent.value);
  applyDefaultsDecorations();
}

const queueSyncFromOverrides = debounce(syncFromOverrides, SYNC_DEBOUNCE_MS);

function onOverridesInput(value: string) {
  if (value === overridesContent.value) {
    return;
  }

  overridesContent.value = value;
  emit('update:value', value);
  queueSyncFromOverrides();
}

// Undefined for mid-edit text that isn't a mapping
function parseDefaultsContent(): object | undefined {
  let parsed: unknown;

  try {
    parsed = jsyaml.load(defaultsContent.value);
  } catch (e) {
    return undefined;
  }

  if (parsed !== undefined && parsed !== null && !isPlainObject(parsed)) {
    return undefined;
  }

  return (parsed as object) || {};
}

function deriveOverrides() {
  const parsed = parseDefaultsContent();

  if (!parsed) {
    return;
  }

  const overrides = overridesFromEditedValues(props.defaults || {}, parsed);

  if (overrides !== overridesContent.value) {
    overridesContent.value = overrides;
    emit('update:value', overrides);
  }
}

function syncFromDefaults() {
  deriveOverrides();
  overridesEditor.value?.updateValue(overridesContent.value);
  applyDefaultsDecorations();
}

const queueSyncFromDefaults = debounce(syncFromDefaults, SYNC_DEBOUNCE_MS);

function onDefaultsInput(value: string) {
  if (value === defaultsContent.value) {
    return;
  }

  defaultsContent.value = value;
  queueSyncFromDefaults();
}

// Sync right away when leaving a pane, so typing in the other pane doesn't overwrite
// the waiting edit, and the parent has the overrides before e.g. Install is clicked
function onDefaultsBlur() {
  queueSyncFromDefaults.flush();
  redrawDefaults();
}

// A deleted default shows again, as Helm still uses it. Text that doesn't parse is kept.
function redrawDefaults() {
  if (!parseDefaultsContent()) {
    return;
  }

  const merged = mergeOverridesRawText(props.defaults || {}, overridesContent.value);

  if (merged === defaultsContent.value) {
    return;
  }

  defaultsContent.value = merged;
  defaultsEditor.value?.updateValue(merged);
  applyDefaultsDecorations();
}

function onOverridesBlur() {
  queueSyncFromOverrides.flush();
}

watch(() => props.value, (neu) => {
  if (sameYamlOverrides(neu || '', overridesContent.value)) {
    return;
  }

  overridesContent.value = neu || '';
  defaultsContent.value = mergeOverridesRawText(props.defaults || {}, overridesContent.value);

  overridesEditor.value?.updateValue(overridesContent.value);
  defaultsEditor.value?.updateValue(defaultsContent.value);
  applyDefaultsDecorations();
});

watch(() => props.defaults, () => {
  defaultsContent.value = mergeOverridesRawText(props.defaults || {}, overridesContent.value);

  defaultsEditor.value?.updateValue(defaultsContent.value);
  applyDefaultsDecorations();
});

function onDefaultsReady(view: EditorView) {
  defaultsView = view;
  applyDefaultsDecorations();
  keepSearchPanelOpen(view, { placeholder: props.searchPlaceholder, container: searchContainer.value });
}

onBeforeUnmount(() => {
  queueSyncFromDefaults.flush();
  queueSyncFromOverrides.cancel();
  defaultsView = null;
});
</script>

<template>
  <div class="values-panes">
    <div
      class="values-pane"
      :data-testid="defaultsPaneTestid()"
      @focusout="onDefaultsBlur"
    >
      <div class="values-pane__header">
        <h4 class="values-pane__title">
          {{ chartDefaultsLabel }}
        </h4>
        <p class="values-pane__description">
          {{ chartDefaultsHint }}
        </p>
      </div>
      <div class="values-pane__body">
        <div
          ref="searchContainer"
          class="values-pane__search"
        />
        <YamlEditor
          ref="defaultsEditor"
          class="values-pane__editor"
          :value="defaultsContent"
          :component-testid="defaultsTestid()"
          :scrolling="true"
          :editor-mode="editorMode"
          :hide-preview-buttons="true"
          @update:value="onDefaultsInput"
          @onReady="onDefaultsReady"
        />
      </div>
    </div>
    <div
      class="values-pane values-pane--overrides"
      :data-testid="overridesPaneTestid()"
      @focusout="onOverridesBlur"
    >
      <div class="values-pane__header">
        <h4 class="values-pane__title">
          {{ overridesLabel }}
        </h4>
        <p class="values-pane__description">
          {{ overridesHint }}
        </p>
      </div>
      <div class="values-pane__body">
        <YamlEditor
          ref="overridesEditor"
          class="values-pane__editor"
          :value="overridesContent"
          :component-testid="overridesTestid()"
          :scrolling="true"
          :editor-mode="editorMode"
          :hide-preview-buttons="true"
          @update:value="onOverridesInput"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .values-panes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto minmax(0, 1fr);
    column-gap: var(--gap-lg);
    min-height: 0;

    // Both panes share the rows of the grid, so the headers take the same height
    // and the overrides editor starts level with the chart defaults search.
    .values-pane {
      display: grid;
      grid-row: span 2;
      grid-template-rows: subgrid;
      row-gap: 0;
      min-width: 0;
      min-height: 0;

      &__body {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      &__editor, &__editor :deep(.code-mirror), &__editor :deep(.codemirror-container) {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }

      // A long document scrolls instead of stretching the pane
      &__editor {
        contain: size;
        min-height: 200px;
      }

      &__header {
        margin-bottom: 16px;
      }

      // CodeMirror's search panel, styled like a search box above the editor
      &__search {
        :deep(.cm-panels-top) {
          background-color: transparent;
          border-bottom: none;

          &::before {
            display: none;
          }
        }

        :deep(.cm-panel.cm-search) {
          padding: 0 0 8px;

          .cm-search-field {
            height: $unlabeled-input-height;
          }

          .cm-search-controls button:disabled {
            display: none;
          }
        }
      }

      &__title {
        font-weight: 600;
        margin: 0 0 4px 0;
      }

      &__description {
        color: var(--input-label);
      }

      :deep(.cm-line.line-override-highlight),
      :deep(.cm-gutterElement.line-override-highlight) {
        background-color: var(--tertiary, var(--accent-btn));
      }

      &--overrides {
        // This editor is as tall as its document, up to the room it has
        .values-pane__body {
          contain: size;
        }

        .values-pane__editor {
          flex: 0 1 auto;
          contain: none;
          min-height: 0;
        }

        // Every line here is an override. The gutter is see-through so a see-through
        // tint isn't painted twice.
        :deep(.codemirror-container .rc-code-mirror) {
          --rc-cm-bg: var(--tertiary, var(--accent-btn));
        }

        :deep(.codemirror-container .cm-gutters) {
          background-color: transparent;
        }
      }
    }
  }
</style>
