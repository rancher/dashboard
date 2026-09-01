<script>
import jsyaml from 'js-yaml';
import { mapPref, DIFF } from '@shell/store/prefs';
import isEmpty from 'lodash/isEmpty';
import { saferDump } from '@shell/utils/create-yaml';
import CodeMirror from './CodeMirror';
import FileDiff from './FileDiff';

export const EDITOR_MODES = {
  EDIT_CODE: 'EDIT_CODE',
  VIEW_CODE: 'VIEW_CODE',
  DIFF_CODE: 'DIFF_CODE'
};

export default {
  emits: ['update:value', 'newObject', 'onInput', 'onReady', 'onChanges', 'validationChanged'],

  components: {
    CodeMirror,
    FileDiff
  },
  props: {
    editorMode: {
      type:    String,
      default: EDITOR_MODES.EDIT_CODE,
      validator(value) {
        return Object.values(EDITOR_MODES).includes(value);
      }
    },

    mode: {
      type:    String,
      default: '',
    },

    asObject: {
      type:    Boolean,
      default: false,
    },

    initialYamlValues: {
      type:    [String, Object],
      default: '',
    },

    scrolling: {
      type:    Boolean,
      default: true,
    },

    value: {
      type:    [String, Object],
      default: '',
    },

    hidePreviewButtons: {
      type:    Boolean,
      default: false,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'yaml-editor'
    },

    /**
     * Opt in to the changed-line highlight; forwarded to CodeMirror, which treats
     * `highlightLines` as a no-op unless this is set.
     */
    highlightEnabled: {
      type:    Boolean,
      default: false,
    },

    /**
     * By default an empty `initialYamlValues` baseline falls back to the current
     * value, so the diff shows "no changes" when no baseline is supplied. Set
     * this when an empty string is a meaningful baseline (e.g. an overrides diff
     * where the saved overrides are genuinely empty) so additions still show.
     */
    allowEmptyDiffBase: {
      type:    Boolean,
      default: false,
    },

    /**
     * Show line numbers on a read-only editor (they're off by default there),
     * plus the (empty) lint-marker gutter, so a read-only editor keeps the same
     * gutters an editable one has. Linting itself stays off.
     */
    showLineNumbersInReadOnly: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    const { initialYamlValues, value } = this;
    let curValue;
    let original;

    if ( this.asObject ) {
      curValue = saferDump(value);
    } else {
      curValue = value || '';
    }

    if ( this.asObject && initialYamlValues) {
      original = saferDump(initialYamlValues);
    } else {
      original = initialYamlValues;
    }

    if ( isEmpty(original) && !this.allowEmptyDiffBase ) {
      original = value;
    }

    return { original, curValue };
  },

  computed: {
    codeMirrorOptions() {
      const readOnly = this.editorMode === EDITOR_MODES.VIEW_CODE;
      // Line numbers and the lint-marker gutter normally show only when editable,
      // but `showLineNumbersInReadOnly` opts a read-only editor into them too.
      const showEditableGutters = !readOnly || this.showLineNumbersInReadOnly;

      const gutters = [];

      if ( showEditableGutters ) {
        gutters.push('CodeMirror-lint-markers');
      }

      gutters.push('CodeMirror-foldgutter');

      return {
        readOnly,
        gutters,
        mode:            'yaml',
        lint:            !readOnly,
        lineNumbers:     showEditableGutters,
        styleActiveLine: false,
        tabSize:         2,
        indentWithTabs:  false,
        cursorBlinkRate: ( readOnly ? -1 : 530 ),
        extraKeys:       {
          'Ctrl-Space': 'autocomplete',

          Tab: (cm) => {
            if (cm.somethingSelected()) {
              cm.indentSelection('add');

              return;
            }

            cm.execCommand('insertSoftTab');
          },

          'Shift-Tab': (cm) => {
            cm.indentSelection('subtract');
          }
        },
        screenReaderLabel: this.t('import.editor.label'),
        // @TODO find a better way to display the outline
        // foldOptions: {
        //   widget: (from, to) => {
        //     const count = to.line - from.line;

        //     return count ? `\u21A4${ count }\u21A6` : '\u2194';
        //   }
        // }
      };
    },

    isPreview() {
      return this.editorMode === EDITOR_MODES.DIFF_CODE;
    },

    diffMode: mapPref(DIFF),

    showCodeEditor() {
      return [EDITOR_MODES.EDIT_CODE, EDITOR_MODES.VIEW_CODE].includes(this.editorMode);
    },
  },

  watch: {
    showUploadPrompt(neu) {
      if (neu) {
        this.$refs.yamluploader.click();
      }
    },
  },

  methods: {
    focus() {
      if ( this.$refs.cm ) {
        this.$refs.cm.focus();
      }
    },

    refresh() {
      if ( this.$refs.cm ) {
        this.$refs.cm.refresh();
      }
    },

    onInput(value) {
      if ( !this.asObject ) {
        this.$emit('update:value', ...arguments);
      }

      try {
        const parsed = jsyaml.load(value);

        if ( this.asObject ) {
          this.$emit('update:value', parsed);
        } else {
          this.$emit('newObject', parsed);
        }
      } catch (ex) {}

      this.$emit('onInput', ...arguments);
    },

    onReady() {
      this.$emit('onReady', ...arguments);
    },

    onChanges() {
      this.$emit('onChanges', ...arguments);
    },

    updateValue(value) {
      this.curValue = value;
      this.$refs.cm?.updateValue(value);
    },

    highlightLines(lineNumbers) {
      this.$refs.cm?.highlightLines(lineNumbers);
    }
  }
};
</script>

<template>
  <div class="yaml-editor">
    <div class="text-right">
      <span
        v-if="isPreview && !hidePreviewButtons"
        v-trim-whitespace
        class="btn-group btn-sm diff-mode"
      >
        <button
          role="button"
          :aria-label="t('generic.unified')"
          type="button"
          class="btn btn-sm bg-default"
          :class="{'active': diffMode !== 'split'}"
          @click="diffMode='unified'"
        >{{ t('generic.unified') }}</button>
        <button
          role="button"
          :aria-label="t('generic.split')"
          type="button"
          class="btn btn-sm bg-default"
          :class="{'active': diffMode === 'split'}"
          @click="diffMode='split'"
        >{{ t('generic.split') }}</button>
      </span>
    </div>
    <CodeMirror
      v-if="showCodeEditor"
      ref="cm"
      :class="{fill: true, scrolling: scrolling}"
      :value="curValue"
      :options="codeMirrorOptions"
      :showKeyMapBox="true"
      :highlight-enabled="highlightEnabled"
      :data-testid="componentTestid + '-code-mirror'"
      :mode="mode"
      @onInput="onInput"
      @onReady="onReady"
      @onChanges="onChanges"
      @validationChanged="$emit('validationChanged', $event)"
    />
    <FileDiff
      v-else
      :class="{fill: true, scrolling: scrolling}"
      :filename="'.yaml'"
      :side-by-side="diffMode === 'split'"
      :orig="original"
      :neu="curValue"
      :footer-space="80"
    />
  </div>
</template>

<style lang="scss">
.yaml-editor {
  display: flex;
  flex-direction: column;

  .fill {
    flex: 1;
  }

  .codemirror-container  {
    position: relative;
    background-color: var(--yaml-editor-bg);

    .CodeMirror {
      background: none;
      & .CodeMirror-gutters {
        background-color: var(--yaml-editor-bg);
      }
    }
  }

  .diff-mode {
    background-color: var(--diff-header-bg);
    padding: 5px 5px;

    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }

  .d2h-file-wrapper {
    border-top-right-radius: 0;
  }
}
</style>
