<script>
import { diffLines } from 'diff';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { mergeOverrides, overridesAreMergeable } from '@shell/utils/chart-values';

/**
 * Two-pane YAML values editor: a LEFT editable "overrides" pane and a RIGHT
 * read-only "final values" preview.
 *
 * Preview modes:
 *  - Smart (recommended): pass `defaults` and the component merges the overrides
 *    (`value`) onto them, keeping the last valid preview while mid-edit/invalid.
 *  - Controlled: leave `defaults` unset and pass a ready-made `preview` string.
 *
 * YamlEditor doesn't react to its `value` prop, so the recomputed preview is
 * pushed into the read-only editor via its ref when the effective preview changes.
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
     * lets `effectivePreview` hold the last valid preview.
     */
    mergeablePreview() {
      if (!this.smartMode || !overridesAreMergeable(this.value)) {
        return null;
      }

      return mergeOverrides(this.defaults || {}, this.value);
    },

    /**
     * The preview shown in the right pane: the `preview` prop in controlled mode,
     * or the sticky computed merge in smart mode (defaults until something valid
     * is typed).
     */
    effectivePreview() {
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

  watch: {
    // Smart mode: remember the last valid merge so `effectivePreview` can keep
    // showing it while the overrides are mid-edit/invalid. Immediate to seed on load.
    mergeablePreview: {
      handler(neu) {
        if (neu !== null) {
          this.lastValidPreview = neu;
        }
      },
      immediate: true,
    },

    effectivePreview(neu, old) {
      // Work out which lines changed before we replace the document, then flash
      // them once the new content is in place to draw the eye to the change.
      const changed = this.changedLineNumbers(old, neu);

      this.$nextTick(() => {
        this.$refs.finalEditor?.updateValue(neu);
        this.$refs.finalEditor?.refresh();
        this.$refs.finalEditor?.highlightLines(changed);
      });
    },
  },

  methods: {
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
     */
    changedLineNumbers(old, neu) {
      if (!old) {
        return [];
      }

      const lines = [];
      let lineNo = 0;

      diffLines(old || '', neu || '').forEach((part) => {
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
        :value="effectivePreview"
        :component-testid="finalTestid"
        :scrolling="true"
        mode="view"
        :editor-mode="EDITOR_MODES.VIEW_CODE"
        :hide-preview-buttons="true"
        :highlight-enabled="true"
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
