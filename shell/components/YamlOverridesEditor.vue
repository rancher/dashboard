<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue';
import jsyaml from 'js-yaml';
import debounce from 'lodash/debounce';
import isPlainObject from 'lodash/isPlainObject';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { overridesFromEditedValues, mergeOverridesRawText, changedLineNumbers, sameYamlOverrides } from '@shell/utils/chart-values';
import { countMatches, MIN_SEARCH_LENGTH } from '@shell/utils/yaml-search';

/**
 * Two editable YAML panes for chart values:
 *  - LEFT "Chart defaults": the full effective document (defaults + overrides).
 *    Lines that differ from the defaults are tinted.
 *  - RIGHT "Your overrides": only the values that differ from the defaults - what
 *    is actually saved (mirrors `helm install --values`). Every line is tinted.
 *
 * Editing either side updates the other: the RIGHT pane is the source of truth
 * (bound to `value` via v-model). Editing the LEFT pane diffs it back against the
 * defaults to recompute the overrides. Only the overrides are ever emitted/saved.
 *
 * The cross-pane sync is debounced and kept off the keystroke path (parse + merge
 * + diff is O(document)), and pushed into the *other* editor via its ref -
 * YamlEditor doesn't react to its `value` prop after mount.
 */

// Delay before the opposite pane (and the decorations) recompute after the last
// keystroke, so the pane being typed in stays responsive on large values files.
const SYNC_DEBOUNCE_MS = 400;

// Shared line-background class (same light tint for changed/new/override lines).
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

// True while we push content into an editor programmatically, so the resulting
// update:value echo doesn't loop back through the input handlers.
const isSyncing = ref(false);

// The live text of each pane.
const overridesContent = ref(props.value || '');
const defaultsContent = ref(mergeOverridesRawText(props.defaults || {}, overridesContent.value));

const defaultsPaneTestid = () => `${ props.testidPrefix }-defaults-pane`;
const overridesPaneTestid = () => `${ props.testidPrefix }-overrides-pane`;
const defaultsTestid = () => `${ props.testidPrefix }-defaults`;
const overridesTestid = () => `${ props.testidPrefix }-overrides`;
const searchTestid = () => `${ props.testidPrefix }-defaults-search`;

// The chart-defaults search: what the user typed, the query it ran with (empty
// until it has MIN_SEARCH_LENGTH characters) and how many matches it found.
const searchQuery = ref('');
const activeSearchQuery = ref('');
const matchCount = ref(0);

/** Run `fn` (a programmatic editor update) without its update:value echo looping back. */
function withoutEcho(fn: () => void) {
  isSyncing.value = true;
  fn();
  nextTick(() => {
    isSyncing.value = false;
  });
}

/** LEFT-pane decorations: tint each leaf line that differs from the defaults. */
function applyDefaultsDecorations() {
  const decorations = changedLineNumbers(props.defaults || {}, defaultsContent.value).map((line) => ({
    line,
    className: OVERRIDE_LINE_CLASS,
  }));

  defaultsEditor.value?.setLineDecorations(decorations);
}

/** RIGHT-pane decorations: every non-blank line is an override, so tint them all. */
function applyOverridesDecorations() {
  const decorations = (overridesContent.value || '').split('\n').reduce((acc: any[], line, idx) => {
    if (line.trim()) {
      acc.push({ line: idx, className: OVERRIDE_LINE_CLASS });
    }

    return acc;
  }, []);

  overridesEditor.value?.setLineDecorations(decorations);
}

// --- Editing the RIGHT (overrides) pane -------------------------------------

function syncFromOverrides() {
  defaultsContent.value = mergeOverridesRawText(props.defaults || {}, overridesContent.value);

  withoutEcho(() => defaultsEditor.value?.updateValue(defaultsContent.value));
  applyDefaultsDecorations();
  applyOverridesDecorations();
}

const queueSyncFromOverrides = debounce(syncFromOverrides, SYNC_DEBOUNCE_MS);

function onOverridesInput(value: string) {
  if (isSyncing.value) {
    return;
  }

  overridesContent.value = value;
  emit('update:value', value);
  queueSyncFromOverrides();
}

// --- Editing the LEFT (chart defaults) pane ---------------------------------

function syncFromDefaults() {
  withoutEcho(() => overridesEditor.value?.updateValue(overridesContent.value));
  applyOverridesDecorations();
  applyDefaultsDecorations();
}

const queueSyncFromDefaults = debounce(syncFromDefaults, SYNC_DEBOUNCE_MS);

function onDefaultsInput(value: string) {
  if (isSyncing.value) {
    return;
  }

  defaultsContent.value = value;

  let parsed: unknown;

  try {
    parsed = jsyaml.load(value);
  } catch (e) {
    // Mid-edit invalid YAML: keep the last good overrides, just refresh the tint.
    queueSyncFromDefaults();

    return;
  }

  // Helm values must be a mapping; a bare scalar/array is mid-edit - don't derive
  // overrides from it, but still re-tint what's there.
  if (parsed !== undefined && parsed !== null && !isPlainObject(parsed)) {
    queueSyncFromDefaults();

    return;
  }

  // A key the user deleted here keeps its default rather than being saved as null.
  const overrides = overridesFromEditedValues(props.defaults || {}, (parsed as object) || {});

  overridesContent.value = overrides;
  emit('update:value', overrides);
  queueSyncFromDefaults();
}

// --- Switching panes --------------------------------------------------------

// A sync is only ever pending for the pane the user was last typing in. Run it
// right away when focus moves to the other pane, so that pane is up to date before
// the user types in it. Otherwise their next keystroke would be based on stale
// text and overwrite the edit that was still waiting to sync.
function onDefaultsFocus() {
  queueSyncFromOverrides.flush();
}

function onOverridesFocus() {
  queueSyncFromDefaults.flush();
}

// --- Searching the LEFT (chart defaults) pane -------------------------------

// Count the matches and highlight them in the editor. The editor stays editable,
// and CodeMirror re-highlights the lines the user edits by itself.
function runSearch() {
  const query = searchQuery.value.trim();

  activeSearchQuery.value = query.length >= MIN_SEARCH_LENGTH ? query : '';
  matchCount.value = countMatches(defaultsContent.value, activeSearchQuery.value);
  defaultsEditor.value?.setSearchHighlight(matchCount.value ? activeSearchQuery.value : '');
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

// --- External prop changes --------------------------------------------------

// React to `value` changing from outside (e.g. the parent seeding the pane). Our
// own emits are ignored via the content compare so this doesn't loop.
watch(() => props.value, (neu) => {
  if (isSyncing.value || sameYamlOverrides(neu || '', overridesContent.value)) {
    return;
  }

  overridesContent.value = neu || '';
  defaultsContent.value = mergeOverridesRawText(props.defaults || {}, overridesContent.value);

  withoutEcho(() => {
    overridesEditor.value?.updateValue(overridesContent.value);
    defaultsEditor.value?.updateValue(defaultsContent.value);
  });

  applyOverridesDecorations();
  applyDefaultsDecorations();
});

watch(() => props.defaults, () => {
  defaultsContent.value = mergeOverridesRawText(props.defaults || {}, overridesContent.value);

  withoutEcho(() => defaultsEditor.value?.updateValue(defaultsContent.value));
  applyDefaultsDecorations();
  applyOverridesDecorations();
});

// --- Ready / lifecycle ------------------------------------------------------

function onDefaultsReady() {
  applyDefaultsDecorations();
}

function onOverridesReady() {
  applyOverridesDecorations();
}

onBeforeUnmount(() => {
  queueSyncFromOverrides.cancel();
  queueSyncFromDefaults.cancel();
  queueSearch.cancel();
});

/**
 * Seed the overrides pane from the parent (e.g. after a pull-secret change) and
 * sync the defaults pane to match. Both editors are updated via their refs since
 * YamlEditor doesn't react to its `value` prop after mount.
 */
function updateOverrides(value: string) {
  overridesContent.value = value || '';
  defaultsContent.value = mergeOverridesRawText(props.defaults || {}, overridesContent.value);

  withoutEcho(() => {
    overridesEditor.value?.updateValue(overridesContent.value);
    defaultsEditor.value?.updateValue(defaultsContent.value);
  });

  applyOverridesDecorations();
  applyDefaultsDecorations();
  emit('update:value', overridesContent.value);
}

// Exposed so the Options-API parent can seed the overrides pane via its ref.
defineExpose({ updateOverrides });
</script>

<template>
  <div class="values-panes">
    <div
      class="values-pane"
      :data-testid="defaultsPaneTestid()"
      @focusin="onDefaultsFocus"
    >
      <div class="values-pane__header">
        <h4 class="values-pane__title">
          {{ chartDefaultsLabel }}
        </h4>
        <p class="values-pane__description">
          {{ chartDefaultsHint }}
        </p>
      </div>
      <div
        class="values-search"
        :class="{ 'values-search--active': !!activeSearchQuery }"
      >
        <i class="icon icon-search values-search__icon" />
        <input
          v-model="searchQuery"
          type="search"
          class="input-sm values-search__input"
          :placeholder="t('yamlOverridesEditor.search.placeholder')"
          :aria-label="t('yamlOverridesEditor.search.ariaLabel')"
          :data-testid="searchTestid()"
          @keydown.esc.prevent="clearSearch"
        >
        <div class="values-search__addons">
          <!-- Always rendered so screen readers announce the count when it changes -->
          <span
            class="values-search__count"
            aria-live="polite"
            :data-testid="`${ searchTestid() }-count`"
          >{{ activeSearchQuery ? t('yamlOverridesEditor.search.matches', { count: matchCount }) : '' }}</span>
          <button
            v-if="matchCount"
            type="button"
            class="btn role-link values-search__clear"
            :aria-label="t('yamlOverridesEditor.search.clear')"
            :data-testid="`${ searchTestid() }-clear`"
            @click="clearSearch"
          >
            <i class="icon icon-close" />
          </button>
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
    <div
      class="values-pane"
      :data-testid="overridesPaneTestid()"
      @focusin="onOverridesFocus"
    >
      <div class="values-pane__header">
        <h4 class="values-pane__title">
          {{ overridesLabel }}
        </h4>
        <p class="values-pane__description">
          {{ overridesHint }}
        </p>
      </div>
      <YamlEditor
        ref="overridesEditor"
        class="values-pane__editor"
        :value="overridesContent"
        :component-testid="overridesTestid()"
        :scrolling="true"
        :editor-mode="editorMode"
        :hide-preview-buttons="true"
        @update:value="onOverridesInput"
        @onReady="onOverridesReady"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .values-panes {
    display: flex;
    gap: var(--gap-lg);
    min-height: 0;
    // Size each pane to its own content so neither is stretched by the taller one.
    align-items: flex-start;

    .values-pane {
      display: flex;
      flex-direction: column;
      flex: 1 1 50%;
      min-width: 0;
      min-height: 0;

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
    }
  }

  .values-search {
    position: relative;
    margin-bottom: 8px;

    &__icon {
      position: absolute;
      top: 50%;
      left: 12px;
      transform: translateY(-50%);
      color: var(--input-placeholder);
      pointer-events: none;
    }

    &__input {
      width: 100%;
      padding-left: 36px;

      // We show our own clear button, only when there are matches.
      &::-webkit-search-cancel-button {
        -webkit-appearance: none;
      }
    }

    // Make room so the typed text doesn't run under the count and the clear button.
    &--active &__input {
      padding-right: 150px;
    }

    &__addons {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
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

    &__clear {
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
