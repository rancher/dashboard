<script>
import { diffLines } from 'diff';
import debounce from 'lodash/debounce';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { mergeOverrides, mergeOverridesIfMergeable } from '@shell/utils/chart-values';

// Delay before the preview recomputes after the last keystroke. The merge +
// serialize + diff + full editor replace is O(document), so we defer it until
// typing pauses to keep the editable pane responsive on large values files.
const PREVIEW_DEBOUNCE_MS = 400;

/**
 * Two-pane YAML values editor: a LEFT editable "overrides" pane and a RIGHT
 * read-only "final values" preview.
 *
 * Preview modes:
 *  - Smart (recommended): pass `defaults` and the component merges the overrides
 *    (`value`) onto them, keeping the last valid preview while mid-edit/invalid.
 *  - Controlled: leave `defaults` unset and pass a ready-made `preview` string.
 *
 * The merge is kept off the render path: the read-only pane is bound to the
 * `previewValue` data field, which is updated only by the debounced
 * `recomputePreview` (YamlEditor doesn't react to its `value` prop after mount,
 * so the new content is pushed in via its ref).
 */
export default {
  name: 'YamlOverridesEditor',

  components: { YamlEditor },

  props: {
    /** Editable overrides YAML (use with v-model:value). */
    value: {
      type:    String,
      default: '',
    },
    /** Controlled-mode preview shown in the right pane. Ignored in smart mode. */
    preview: {
      type:    String,
      default: '',
    },
    /**
     * Smart-mode base values: when set, the component computes the preview by
     * merging the overrides (`value`) onto these. Leave unset to drive `preview`.
     */
    defaults: {
      type:    Object,
      default: null,
    },
    /** Editor mode for the editable pane (e.g. EDIT_CODE / DIFF_CODE). */
    editorMode: {
      type:    String,
      default: EDITOR_MODES.EDIT_CODE,
    },
    /** Baseline used by the editable pane's own diff view. */
    initialYamlValues: {
      type:    String,
      default: '',
    },
    overridesLabel: {
      type:    String,
      default: '',
    },
    overridesHint: {
      type:    String,
      default: '',
    },
    finalLabel: {
      type:    String,
      default: '',
    },
    finalHint: {
      type:    String,
      default: '',
    },
    /**
     * Prefix for the data-testids rendered on each pane and editor, e.g.
     * `chart-values` produces `chart-values-overrides-pane` and (via YamlEditor)
     * `chart-values-overrides-code-mirror`.
     */
    testidPrefix: {
      type:    String,
      default: 'values',
    },
  },

  emits: ['update:value'],

  data() {
    return {
      EDITOR_MODES,
      // Content currently shown in the read-only pane. Updated only by the
      // debounced recomputePreview so the merge stays off the keystroke path.
      previewValue:     '',
      // Smart mode: last preview that came from valid overrides, kept so the
      // preview doesn't revert to the bare defaults while the user is mid-edit.
      lastValidPreview: null,
    };
  },

  computed: {
    /** Whether the component computes the preview itself (see `defaults`). */
    smartMode() {
      return this.defaults !== null;
    },

    /**
     * Smart mode: defaults merged with the current overrides, or null when they're
     * mid-edit/invalid (a plain merge would collapse to bare defaults). The null
     * lets `resolvedPreview` hold the last valid preview. Lazy - read only from
     * recomputePreview (and tests), never from the template, so the merge doesn't
     * run on every keystroke.
     */
    mergeablePreview() {
      if (!this.smartMode) {
        return null;
      }

      return mergeOverridesIfMergeable(this.defaults || {}, this.value);
    },

    /**
     * The preview that should be shown: the `preview` prop in controlled mode, or
     * the sticky merge in smart mode (defaults until something valid is typed).
     * Lazy, like mergeablePreview - the template binds `previewValue` instead.
     */
    resolvedPreview() {
      if (!this.smartMode) {
        return this.preview;
      }

      return this.mergeablePreview ?? this.lastValidPreview ?? mergeOverrides(this.defaults || {}, '');
    },

    overridesPaneTestid() {
      return `${ this.testidPrefix }-overrides-pane`;
    },
    finalPaneTestid() {
      return `${ this.testidPrefix }-final-pane`;
    },
    overridesTestid() {
      return `${ this.testidPrefix }-overrides`;
    },
    finalTestid() {
      return `${ this.testidPrefix }-final`;
    },
  },

  // Watch the cheap raw inputs (not the merge computeds, which would then run
  // eagerly on every keystroke) and defer the heavy recompute until typing stops.
  watch: {
    value() {
      this.queuePreview();
    },
    defaults() {
      this.queuePreview();
    },
    preview() {
      this.queuePreview();
    },
  },

  created() {
    this.queuePreview = debounce(this.recomputePreview, PREVIEW_DEBOUNCE_MS);

    // Seed the preview synchronously so the read-only pane is correct on mount
    // (mount is not a "change", so it must not go through the debounce).
    if (this.mergeablePreview !== null) {
      this.lastValidPreview = this.mergeablePreview;
    }
    this.previewValue = this.resolvedPreview;
  },

  beforeUnmount() {
    this.queuePreview?.cancel();
  },

  methods: {
    /**
     * Recompute the preview and push it into the read-only editor. Debounced (via
     * queuePreview) so the merge/serialize/diff/replace only runs once typing
     * pauses, keeping the editable pane responsive on large values files.
     */
    recomputePreview() {
      // Remember the last valid merge so the preview holds it while the overrides
      // are mid-edit/invalid instead of reverting to the bare defaults.
      if (this.mergeablePreview !== null) {
        this.lastValidPreview = this.mergeablePreview;
      }

      const neu = this.resolvedPreview;
      const old = this.previewValue;
      // Work out which lines changed before we replace the document, then flash
      // them once the new content is in place to draw the eye to the change.
      const changed = this.changedLineNumbers(old, neu);

      this.previewValue = neu;

      this.$nextTick(() => {
        this.$refs.finalEditor?.updateValue(neu);
        this.$refs.finalEditor?.refresh();
        this.$refs.finalEditor?.highlightLines(changed);
      });
    },

    /**
     * Push a new value into the editable overrides editor. YamlEditor does not
     * react to its `value` prop, so a programmatic change to the overrides (e.g.
     * seeding from the form's values) must be applied via its ref.
     */
    updateOverrides(value) {
      this.$refs.overridesEditor?.updateValue(value);
    },

    /**
     * The 0-based line numbers in `neu` that were added or changed relative to
     * `old`. Skips the initial population (empty `old`) so the whole preview
     * doesn't flash the first time it is filled in.
     *
     * A typical edit only touches a small contiguous region, so we first trim the
     * common leading/trailing lines (an O(n) scan) and run the diff on just that
     * window. This keeps highlighting fast on huge values files without capping it.
     */
    changedLineNumbers(old, neu) {
      if (!old) {
        return [];
      }

      const oldLines = (old || '').split('\n');
      const neuLines = (neu || '').split('\n');

      // Common leading lines: unchanged, and their indices line up in both docs.
      let prefix = 0;

      while (prefix < oldLines.length && prefix < neuLines.length && oldLines[prefix] === neuLines[prefix]) {
        prefix++;
      }

      // Common trailing lines, not overlapping the prefix already matched.
      let suffix = 0;

      while (
        suffix < oldLines.length - prefix &&
        suffix < neuLines.length - prefix &&
        oldLines[oldLines.length - 1 - suffix] === neuLines[neuLines.length - 1 - suffix]
      ) {
        suffix++;
      }

      // Diff only the changed window, then shift the results back to full-doc
      // indices. Each window keeps a trailing newline so diffLines tokenizes its
      // last line the same way on both sides (tokens carry their own newline).
      const oldWindow = `${ oldLines.slice(prefix, oldLines.length - suffix).join('\n') }\n`;
      const neuWindow = `${ neuLines.slice(prefix, neuLines.length - suffix).join('\n') }\n`;

      return this.addedLineNumbers(oldWindow, neuWindow).map((n) => n + prefix);
    },

    /** The 0-based indices of lines added/changed in `neu` relative to `old`. */
    addedLineNumbers(old, neu) {
      const lines = [];
      let lineNo = 0;

      diffLines(old, neu).forEach((part) => {
        if (part.removed) {
          // Removed lines aren't in the new document, so don't advance the counter.
          return;
        }

        if (part.added) {
          for (let i = 0; i < part.count; i++) {
            lines.push(lineNo + i);
          }
        }

        lineNo += part.count;
      });

      return lines;
    },
  },
};
</script>

<template>
  <div class="values-panes">
    <div
      class="values-pane"
      :data-testid="overridesPaneTestid"
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
        :value="value"
        :component-testid="overridesTestid"
        :scrolling="true"
        :initial-yaml-values="initialYamlValues"
        :editor-mode="editorMode"
        :hide-preview-buttons="true"
        @update:value="$emit('update:value', $event)"
      />
    </div>
    <div
      class="values-pane"
      :data-testid="finalPaneTestid"
    >
      <div class="values-pane__header">
        <h4 class="values-pane__title">
          {{ finalLabel }}
        </h4>
        <p class="values-pane__description">
          {{ finalHint }}
        </p>
      </div>
      <YamlEditor
        ref="finalEditor"
        class="values-pane__editor values-pane__editor--readonly"
        :value="previewValue"
        :component-testid="finalTestid"
        :scrolling="true"
        mode="view"
        :editor-mode="EDITOR_MODES.VIEW_CODE"
        :hide-preview-buttons="true"
        :highlight-enabled="true"
        :show-line-numbers-in-read-only="true"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .values-panes {
    display: flex;
    gap: var(--gap-lg);
    min-height: 0;
    // Size each pane to its own content so the editable pane isn't stretched by
    // the taller read-only pane.
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

      &__editor {
        &--readonly {
          :deep(.CodeMirror),
          :deep(.CodeMirror .CodeMirror-gutters) {
            background-color: var(--body-bg);
          }

          // Read-only preview: the blur hint "Press Shift+Esc..." is meaningless here
          :deep(.escape-text) {
            display: none;
          }
        }
      }
    }
  }
</style>
