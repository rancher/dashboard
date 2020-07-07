<script>
import jsyaml from 'js-yaml';
import { mapPref, DIFF } from '@/store/prefs';
import CodeMirror from './CodeMirror';
import FileDiff from './FileDiff';

export const EDITOR_MODES = {
  EDIT_CODE: 'EDIT_CODE',
  VIEW_CODE: 'VIEW_CODE',
  DIFF_CODE: 'DIFF_CODE'
};

export default {
  components: {
    CodeMirror,
    FileDiff,
  },
  props: {
    value: {
      type:     String,
      required:  true,
    },
    schema: {
      type:    Object,
      default: null,
    },
    editorMode: {
      type:      String,
      default:  EDITOR_MODES.EDIT_CODE,
      validator(value) {
        return Object.values(EDITOR_MODES).includes(value);
      }
    },
    autoResize: {
      type:    Boolean,
      default: true,
    },
  },

  data() {
    return { original: this.value };
  },
  computed: {
    cmOptions() {
      const readOnly = this.editorMode === EDITOR_MODES.VIEW_CODE;

      const gutters = [];

      if ( !readOnly ) {
        gutters.push('CodeMirror-lint-markers');
      }

      gutters.push('CodeMirror-foldgutter');

      return {
        readOnly,
        gutters,
        mode:            'yaml',
        lint:            !readOnly,
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
    value(newYaml) {
      try {
        const parsed = jsyaml.safeLoad(newYaml);

        this.$emit('newObject', parsed);
      } catch (ex) {}
    },

  },
  methods: {
    onInput() {
      this.$emit('input', ...arguments);
      this.$emit('onInput', ...arguments);
    },

    onReady() {
      this.$emit('onReady', ...arguments);
    },

    onChanges() {
      this.$emit('onChanges', ...arguments);
    },
  }
};
</script>

<template>
  <div class="yaml-editor">
    <div class="text-right">
      <span v-if="isPreview" v-trim-whitespace class="btn-group btn-sm diff-mode">
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
      class="fill"
      :value="value"
      :options="cmOptions"
      @onInput="onInput"
      @onReady="onReady"
      @onChanges="onChanges"
    />
    <FileDiff
      v-else
      class="fill"
      :filename="'.yaml'"
      :side-by-side="diffMode === 'split'"
      :orig="original"
      :neu="value"
    />
  </div>
</template>

<style lang="scss" scoped>
.yaml-editor {
  display: flex;
  flex-direction: column;

  .fill {
    flex: 1;
  }

  ::v-deep .code-mirror  {
      position: relative;
      .CodeMirror {
        height: initial;
        position: absolute;
        top:0;
        bottom:0;
        left:0;
        right:0;
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
