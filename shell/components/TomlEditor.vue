<script>
import { mapPref, DIFF } from '@shell/store/prefs';
import isEmpty from 'lodash/isEmpty';
import CodeMirror from './CodeMirror';
import FileDiff from './FileDiff';

export const EDITOR_MODES = {
  EDIT_CODE: 'EDIT_CODE',
  VIEW_CODE: 'VIEW_CODE',
  DIFF_CODE: 'DIFF_CODE'
};

export default {
  components: { CodeMirror, FileDiff },
  props:      {
    editorMode: {
      type:    String,
      default: EDITOR_MODES.EDIT_CODE,
      validator(value) {
        return Object.values(EDITOR_MODES).includes(value);
      }
    },

    asObject: {
      type:    Boolean,
      default: false,
    },

    initialTomlValues: {
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

    lint: {
      type:    Boolean,
      default: true
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'toml-editor'
    }
  },

  data() {
    const { initialTomlValues, value } = this;
    let original;

    const curValue = value || '';

    original = initialTomlValues;

    if ( isEmpty(original) ) {
      original = value;
    }

    return { original, curValue };
  },

  computed: {
    codeMirrorOptions() {
      const readOnly = this.editorMode === EDITOR_MODES.VIEW_CODE;

      const gutters = [];

      if ( !readOnly ) {
        gutters.push('CodeMirror-lint-markers');
      }

      gutters.push('CodeMirror-foldgutter');

      return {
        readOnly,
        gutters,
        mode:            'toml',
        lint:            !readOnly && this.lint,
        lineNumbers:     !readOnly,
        styleActiveLine: true,
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
      this.$emit('input', ...arguments);

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
      this.$refs.cm.updateValue(value);
    }
  }
};
</script>

<template>
  <div class="toml-editor">
    <div class="text-right">
      <span
        v-if="isPreview && !hidePreviewButtons"
        v-trim-whitespace
        class="btn-group btn-sm diff-mode"
      >
        <button
          type="button"
          class="btn btn-sm bg-default"
          :class="{'active': diffMode !== 'split'}"
          @click="diffMode='unified'"
        >Unified</button>
        <button
          type="button"
          class="btn btn-sm bg-default"
          :class="{'active': diffMode === 'split'}"
          @click="diffMode='split'"
        >Split</button>
      </span>
    </div>
    <CodeMirror
      v-if="showCodeEditor"
      ref="cm"
      :class="{fill: true, scrolling: scrolling}"
      :value="curValue"
      :options="codeMirrorOptions"
      :data-testid="componentTestid + '-code-mirror'"
      @onInput="onInput"
      @onReady="onReady"
      @onChanges="onChanges"
    />
    <FileDiff
      v-else
      :class="{fill: true, scrolling: scrolling}"
      :filename="'.yaml'"
      :side-by-side="diffMode === 'split'"
      :orig="original"
      :neu="curValue"
    />
  </div>
</template>

<style lang="scss" scoped>
.toml-editor {
  display: flex;
  flex-direction: column;

  .fill {
    flex: 1;
  }

  ::v-deep .code-mirror  {
    position: relative;

    .CodeMirror {
      background-color: var(--yaml-editor-bg);
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
