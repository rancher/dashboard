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
 * Two editable YAML panes for chart values:
 *  - LEFT "Chart values": the full effective document (defaults + overrides).
 *    Lines that differ from the defaults are tinted.
 *  - RIGHT "Your values": only the values that differ from the defaults - what
 *    is actually saved (mirrors `helm install --values`). The whole pane is tinted.
 *
 * The UI calls both panes "values", but the code keeps the names "defaults" (LEFT)
 * and "overrides" (RIGHT), as "values" is already used for other data here.
 *
 * Editing either side updates the other: the RIGHT pane is the source of truth
 * (bound to `value` via v-model). Editing the LEFT pane diffs it back against the
 * defaults to recompute the overrides. Only the overrides are ever emitted/saved.
 *
 * The work that grows with the document is debounced: deriving the overrides
 * from an edited LEFT pane (parse + diff), pushing the text into the *other* pane
 * (merge + dump) and re-tinting. The text is pushed via the editor's ref, since
 * YamlEditor doesn't react to its `value` prop after mount. The tint and the
 * search talk to the chart-defaults CodeMirror view directly. The search is
 * CodeMirror's own search bar, kept open in the chart-defaults pane.
 */

// Delay before the overrides, the opposite pane and the decorations recompute after
// the last keystroke, so the pane being typed in stays responsive on large values files.
const SYNC_DEBOUNCE_MS = 400;

// Line-background class for the changed lines. It's the same tint as the overrides pane.
const OVERRIDE_LINE_CLASS = 'line-override-highlight';

interface Props {
  /** Editable overrides YAML - the saved value (use with v-model:value). */
  value?: string;
  /** Chart default values; the LEFT pane shows these merged with the overrides. */
  defaults?: object | null;
  /** Editor mode for both panes (e.g. EDIT_CODE). */
  editorMode?: string;
  chartDefaultsLabel?: string;
  chartDefaultsHint?: string;
  overridesLabel?: string;
  overridesHint?: string;
  /** Placeholder of the search in the chart-defaults pane. CodeMirror's "Find" when empty. */
  searchPlaceholder?: string;
  /**
   * Prefix for the data-testids on each pane/editor, e.g. `chart-values` produces
   * `chart-values-defaults-pane` and (via YamlEditor) `chart-values-defaults-code-mirror`.
   */
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

// Editors are driven imperatively (YamlEditor doesn't react to its `value` prop
// after mount, so cross-pane updates are pushed in via these refs).
interface YamlEditorRef {
  updateValue(value: string): void;
}

const defaultsEditor = ref<YamlEditorRef | null>(null);
const overridesEditor = ref<YamlEditorRef | null>(null);
// Holds the chart-defaults editor's search panel, above the editor
const searchContainer = ref<HTMLElement | null>(null);

// The chart-defaults CodeMirror view, once it's ready. Not reactive on purpose.
let defaultsView: EditorView | null = null;

// The live text of each pane. An editor echoes the text we push into it back as
// update:value, and the input handlers skip it because it equals this text.
const overridesContent = ref(props.value || '');
const defaultsContent = ref(mergeOverridesRawText(props.defaults || {}, overridesContent.value));

const defaultsPaneTestid = () => `${ props.testidPrefix }-defaults-pane`;
const overridesPaneTestid = () => `${ props.testidPrefix }-overrides-pane`;
const defaultsTestid = () => `${ props.testidPrefix }-defaults`;
const overridesTestid = () => `${ props.testidPrefix }-overrides`;

/** LEFT-pane decorations: tint each leaf line that differs from the defaults. */
function applyDefaultsDecorations() {
  if (!defaultsView) {
    return;
  }

  setLineClasses(defaultsView, changedLineNumbers(props.defaults || {}, defaultsContent.value).map((line) => ({
    line,
    className: OVERRIDE_LINE_CLASS,
  })));
}

// --- Editing the RIGHT (overrides) pane -------------------------------------

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

// --- Editing the LEFT (chart defaults) pane ---------------------------------

/** Parse the LEFT pane, or undefined for mid-edit text that isn't a valid mapping. */
function parseDefaultsContent(): object | undefined {
  let parsed: unknown;

  try {
    parsed = jsyaml.load(defaultsContent.value);
  } catch (e) {
    return undefined;
  }

  // Helm values must be a mapping, so a bare scalar/array is still mid-edit
  if (parsed !== undefined && parsed !== null && !isPlainObject(parsed)) {
    return undefined;
  }

  return (parsed as object) || {};
}

/**
 * Derive the overrides from the edited LEFT pane and emit them. Mid-edit text that
 * isn't a valid mapping keeps the last good overrides.
 */
function deriveOverrides() {
  const parsed = parseDefaultsContent();

  if (!parsed) {
    return;
  }

  // A key the user deleted here keeps its default rather than being saved as null.
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

// --- Leaving a pane ---------------------------------------------------------

// A sync is only ever pending for the pane the user was last typing in. Run it
// right away when focus leaves that pane. Then the other pane is up to date before
// the user types in it, so their next keystroke doesn't overwrite the edit that was
// still waiting. And the parent has the latest overrides before a button (e.g.
// Install) is clicked.
function onDefaultsBlur() {
  queueSyncFromDefaults.flush();
  redrawDefaults();
}

// Redraw the LEFT pane from the defaults and the overrides once the user leaves it,
// so a default they deleted shows again, as it is still what Helm will use. Mid-edit
// text that doesn't parse is kept, so the user doesn't lose it.
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

// --- External prop changes --------------------------------------------------

// React to `value` changing from outside (e.g. the parent seeding the pane). Our
// own emits are ignored via the content compare so this doesn't loop.
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

// --- Ready / lifecycle ------------------------------------------------------

function onDefaultsReady(view: EditorView) {
  defaultsView = view;
  applyDefaultsDecorations();
  keepSearchPanelOpen(view, { placeholder: props.searchPlaceholder, container: searchContainer.value });
}

onBeforeUnmount(() => {
  // Don't lose a chart-defaults edit that is still waiting to be emitted
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
    // The bodies take the height left under the headers, and each editor scrolls
    // inside it rather than growing the page.
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

      // Pass the height down to CodeMirror, whose own scroller then scrolls the document.
      &__editor, &__editor :deep(.code-mirror), &__editor :deep(.codemirror-container) {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }

      // The document doesn't count towards the size of the pane, so a long one
      // scrolls rather than stretches it. When there isn't room the editor still
      // keeps this height, and the page scrolls instead.
      &__editor {
        contain: size;
        min-height: 200px;
      }

      &__header {
        margin-bottom: 16px;
      }

      // CodeMirror's search panel, moved out of the editor's frame so it looks like a
      // search box above it, the size of an input without a label. The `.cm-panel.cm-search`
      // makes these win over the editor's theme.
      &__search {
        :deep(.cm-panels-top) {
          background-color: transparent;
          border-bottom: none;

          // A layer that mutes the code scrolling past above the panel, which isn't needed here
          &::before {
            display: none;
          }
        }

        :deep(.cm-panel.cm-search) {
          padding: 0 0 8px;

          .cm-search-field {
            height: $unlabeled-input-height;
          }

          // Like the charts page search, the arrows only show when there are matches
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

      // The lines that differ from the chart defaults, on the code and the gutter, in
      // the blue of a tertiary button (see RcButton)
      :deep(.cm-line.line-override-highlight),
      :deep(.cm-gutterElement.line-override-highlight) {
        background-color: var(--tertiary, var(--accent-btn));
      }

      &--overrides {
        // The overrides editor takes the height of its document instead, up to the
        // room under the header, and then scrolls. So the body keeps the document
        // out of the size of the pane.
        .values-pane__body {
          contain: size;
        }

        .values-pane__editor {
          flex: 0 1 auto;
          contain: none;
          min-height: 0;
        }

        // Every line here is an override, so the whole editor gets the tint of the
        // changed lines in the chart defaults pane. Some themes have a see-through
        // tint, so the gutter lets the editor's tint show instead of painting it a
        // second time.
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
