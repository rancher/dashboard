<script>
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';

/**
 * Two-pane YAML values editor: a LEFT editable "overrides" pane and a RIGHT
 * read-only "final values" preview. The parent owns the data (what the defaults
 * are, how the preview is computed) - this component is purely presentational.
 *
 * The preview must be supplied via the `preview` prop; YamlEditor does not react
 * to changes of its `value` prop, so this component pushes the recomputed
 * preview into the read-only editor via its ref whenever `preview` changes.
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
    /** Read-only "final values" YAML shown in the right pane. */
    preview: {
      type:    String,
      default: '',
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
    return { EDITOR_MODES };
  },

  computed: {
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
    preview(neu) {
      this.$nextTick(() => {
        this.$refs.finalEditor?.updateValue(neu);
        this.$refs.finalEditor?.refresh();
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
        :value="preview"
        :component-testid="finalTestid"
        :scrolling="true"
        mode="view"
        :editor-mode="EDITOR_MODES.VIEW_CODE"
        :hide-preview-buttons="true"
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
