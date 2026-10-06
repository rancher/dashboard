<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import jsyaml from 'js-yaml';
import debounce from 'lodash/debounce';
import isPlainObject from 'lodash/isPlainObject';
import type { EditorView } from '@codemirror/view';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { overridesFromEditedValues, mergeOverridesRawText, changedLineNumbers, sameYamlOverrides } from '@shell/utils/chart-values';
import { setLineClasses } from '@shell/utils/code-mirror-line-classes';
import { MIN_SEARCH_LENGTH, findYamlSearchMatch, setYamlSearch, yamlSearchMatches } from '@shell/utils/yaml-search';
import type { YamlSearchMatches } from '@shell/utils/yaml-search';

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
 * YamlEditor doesn't react to its `value` prop after mount. Search and tint talk
 * to the chart-defaults CodeMirror view directly.
 */

// Delay before the overrides, the opposite pane and the decorations recompute after
// the last keystroke, so the pane being typed in stays responsive on large values files.
const SYNC_DEBOUNCE_MS = 400;

// Line-background class for the changed lines. It's the same tint as the overrides pane.
const OVERRIDE_LINE_CLASS = 'line-override-highlight';

// Delay before the chart-defaults search runs after the last keystroke.
const SEARCH_DEBOUNCE_MS = 250;

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
  testidPrefix:       'values',
});

const emit = defineEmits<{(e: 'update:value', value: string): void }>();

// Editors are driven imperatively (YamlEditor doesn't react to its `value` prop
// after mount, so cross-pane updates are pushed in via these refs).
const defaultsEditor = ref<any>(null);
const overridesEditor = ref<any>(null);

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
const searchTestid = () => `${ props.testidPrefix }-defaults-search`;

// The chart-defaults search: what the user typed, the query it ran with (empty
// until it has MIN_SEARCH_LENGTH characters), and its matches.
const searchQuery = ref('');
const activeSearchQuery = ref('');
const matches = ref<YamlSearchMatches>({ current: 0, total: 0 });

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

/**
 * Derive the overrides from the edited LEFT pane and emit them. Mid-edit text that
 * isn't a valid mapping keeps the last good overrides.
 */
function deriveOverrides() {
  let parsed: unknown;

  try {
    parsed = jsyaml.load(defaultsContent.value);
  } catch (e) {
    return;
  }

  // Helm values must be a mapping, so a bare scalar/array is still mid-edit
  if (parsed !== undefined && parsed !== null && !isPlainObject(parsed)) {
    return;
  }

  // A key the user deleted here keeps its default rather than being saved as null.
  const overrides = overridesFromEditedValues(props.defaults || {}, (parsed as object) || {});

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
}

function onOverridesBlur() {
  queueSyncFromOverrides.flush();
}

// --- Searching the LEFT (chart defaults) pane -------------------------------

// Highlight and count the matches in the editor. The editor stays editable, and
// CodeMirror re-highlights the lines the user edits by itself.
function runSearch() {
  const query = searchQuery.value.trim();
  const active = query.length >= MIN_SEARCH_LENGTH ? query : '';
  const isNewQuery = active !== activeSearchQuery.value;

  activeSearchQuery.value = active;

  if (!defaultsView) {
    return;
  }

  setYamlSearch(defaultsView, active);

  // Like a browser, a new query selects its first match. An edit keeps the selection.
  matches.value = isNewQuery ? findYamlSearchMatch(defaultsView, 'first') : yamlSearchMatches(defaultsView.state);
}

const queueSearch = debounce(runSearch, SEARCH_DEBOUNCE_MS);

// Wait for the user to stop typing before searching, but clear a search right away
// once the query gets too short, since that costs nothing.
watch(searchQuery, (query) => {
  if (query.trim().length < MIN_SEARCH_LENGTH) {
    queueSearch.cancel();
    runSearch();
  } else {
    queueSearch();
  }
});

// Keep the match count right while the chart-defaults document changes.
watch(defaultsContent, () => {
  if (activeSearchQuery.value) {
    queueSearch();
  }
});

function clearSearch() {
  searchQuery.value = '';
}

/** Select the next or previous match (wrapping around) and scroll to it. */
function goToMatch(direction: 'next' | 'previous') {
  // A search still waiting for the debounce runs first, which selects its first match.
  if (searchQuery.value.trim() !== activeSearchQuery.value) {
    queueSearch.flush();

    return;
  }

  if (defaultsView && matches.value.total) {
    matches.value = findYamlSearchMatch(defaultsView, direction);
  }
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
}

onBeforeUnmount(() => {
  // Don't lose a chart-defaults edit that is still waiting to be emitted
  queueSyncFromDefaults.flush();
  queueSyncFromOverrides.cancel();
  queueSearch.cancel();
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
          class="values-search"
          :class="{ 'values-search--active': !!activeSearchQuery }"
        >
          <input
            v-model="searchQuery"
            type="search"
            class="input-sm values-search__input"
            :placeholder="t('yamlOverridesEditor.search.placeholder')"
            :aria-label="t('yamlOverridesEditor.search.ariaLabel')"
            :data-testid="searchTestid()"
            @keydown.esc.prevent="clearSearch"
            @keydown.enter.exact.prevent="goToMatch('next')"
            @keydown.shift.enter.exact.prevent="goToMatch('previous')"
          >
          <div class="values-search__addons">
            <button
              v-if="matches.total"
              type="button"
              class="btn role-link values-search__button"
              :aria-label="t('yamlOverridesEditor.search.next')"
              :data-testid="`${ searchTestid() }-next`"
              @click="goToMatch('next')"
            >
              <i class="icon icon-chevron-down" />
            </button>
            <!-- Always rendered so screen readers announce the count when it changes -->
            <span
              class="values-search__count"
              aria-live="polite"
              :data-testid="`${ searchTestid() }-count`"
            >
              <template v-if="matches.current">{{ t('yamlOverridesEditor.search.position', { current: matches.current, total: matches.total }) }}</template>
              <template v-else-if="activeSearchQuery">{{ t('yamlOverridesEditor.search.matches', { count: matches.total }) }}</template>
            </span>
            <button
              v-if="matches.total"
              type="button"
              class="btn role-link values-search__button"
              :aria-label="t('yamlOverridesEditor.search.previous')"
              :data-testid="`${ searchTestid() }-previous`"
              @click="goToMatch('previous')"
            >
              <i class="icon icon-chevron-up" />
            </button>
            <!-- Like the charts page search, the magnifier turns into a clear button once something is typed -->
            <button
              v-if="searchQuery"
              type="button"
              class="btn role-link values-search__button"
              :aria-label="t('yamlOverridesEditor.search.clear')"
              :data-testid="`${ searchTestid() }-clear`"
              @click="clearSearch"
            >
              <i class="icon icon-close" />
            </button>
            <i
              v-else
              class="icon icon-search values-search__icon"
            />
          </div>
        </div>
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

  .values-search {
    // Holds the absolutely placed addons
    position: relative;
    padding-bottom: 8px;

    // Same spot and colour as the clear button that replaces it
    &__icon {
      padding: 4px;
      color: var(--muted);
    }

    // Same size as the icon of the charts page search
    &__icon, &__button .icon-close {
      font-size: 16px;
    }

    &__input {
      width: 100%;
      // Make room for the icon or the clear button
      padding-right: 36px;

      // We show our own clear button, so it looks the same in every browser.
      &::-webkit-search-cancel-button {
        -webkit-appearance: none;
      }
    }

    // Make room so the typed text doesn't run under the count and the buttons.
    &--active &__input {
      padding-right: 180px;
    }

    &__addons {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding-right: 8px;
      // Let clicks on the empty space reach the input underneath.
      pointer-events: none;
    }

    &__count {
      color: var(--input-label);
      font-size: 12px;
      white-space: nowrap;
    }

    &__button {
      color: var(--muted);
      pointer-events: auto;
      min-height: 0;
      line-height: 1;
      padding: 4px;

      // `.role-link` turns white on hover, which disappears on the input.
      &:hover, &:focus-visible {
        color: var(--body-text);
      }
    }
  }
</style>
